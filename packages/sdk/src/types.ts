export interface HayaseDBConfig {
  baseUrl: string;
  token?: string;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
}

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}
