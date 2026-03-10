import { HttpClient } from './http';
import type { HayaseDBConfig } from './types';

export class HayaseDB {
  private readonly http: HttpClient;

  constructor(config: HayaseDBConfig) {
    this.http = new HttpClient(config);
  }

  setToken(token: string | undefined): void {
    this.http.setToken(token);
  }
}
