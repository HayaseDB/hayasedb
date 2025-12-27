import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { AppConfig } from '../config/app.config';
import * as packageJson from '../../package.json';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  getInfo() {
    const appConfig = this.configService.get<AppConfig>('app');
    return {
      name: packageJson.name,
      version: packageJson.version,
      environment: appConfig?.API_ENV,
      uptime: (Date.now() - this.startTime) / 1000,
    };
  }

  async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
