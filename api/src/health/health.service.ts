import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from '../config/app.config';
import { HealthInfoDto } from './dto/health-info.dto';
import * as packageJson from '../../package.json';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly configService: ConfigService) {
    this.logger.debug('Health service initialized');
  }

  getInfo(): HealthInfoDto {
    const appConfig = this.configService.get<AppConfig>('app');
    return {
      name: packageJson.name,
      version: packageJson.version,
      environment: appConfig?.API_ENV ?? 'unknown',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
