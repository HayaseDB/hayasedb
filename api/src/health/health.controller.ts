import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';

import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  info() {
    return this.healthService.getInfo();
  }

  @Get('health/ready')
  @HttpCode(HttpStatus.OK)
  async ready(): Promise<{ status: string }> {
    const isDatabaseHealthy = await this.healthService.checkDatabase();

    if (!isDatabaseHealthy) {
      throw new ServiceUnavailableException({
        status: 'error',
        message: 'Database unavailable',
      });
    }

    return { status: 'ok' };
  }
}
