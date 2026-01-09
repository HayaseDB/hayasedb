import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from '../config/app.config';
import * as packageJson from '../../package.json';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  getInfo() {
    const appConfig = this.configService.get<AppConfig>('app');
    return {
      name: packageJson.name,
      version: packageJson.version,
      environment: appConfig?.API_ENV,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
