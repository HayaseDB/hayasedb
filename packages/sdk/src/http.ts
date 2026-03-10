import {
  AuthenticationError,
  HayaseDBError,
  InternalError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  ValidationError,
} from './errors';
import type { HayaseDBConfig, RequestOptions } from './types';

export class HttpClient {
  private baseUrl: string;
  private token?: string;
  private timeout: number;
  private fetch: typeof globalThis.fetch;

  constructor(config: HayaseDBConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.token = config.token;
    this.timeout = config.timeout ?? 30_000;
    this.fetch = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  setToken(token: string | undefined): void {
    this.token = token;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  async delete<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, options?.params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await this.fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: options?.signal ?? controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): URL {
    const url = new URL(path, this.baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let message: string;
    let errors: Record<string, string[]> | undefined;

    try {
      const body = (await response.json()) as {
        message?: string;
        errors?: Record<string, string[]>;
      };
      message = body.message ?? response.statusText;
      errors = body.errors;
    } catch {
      message = response.statusText;
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 403:
        throw new PermissionError(message);
      case 404:
        throw new NotFoundError(message);
      case 422:
        throw new ValidationError(message, errors);
      case 429: {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(message, retryAfter ? Number(retryAfter) : undefined);
      }
      default:
        if (response.status >= 500) {
          throw new InternalError(message);
        }
        throw new HayaseDBError(message, response.status);
    }
  }
}
