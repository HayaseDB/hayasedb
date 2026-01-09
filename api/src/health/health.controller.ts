import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { HealthService } from './health.service';
import { StorageHealthIndicator } from './indicators';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly storage: StorageHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get application info' })
  info() {
    return this.healthService.getInfo();
  }

  @Get('health/live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return this.health.check([]);
  }

  @Get('health/ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.storage.isHealthy('storage'),
    ]);
  }

  @Get('health')
  @HealthCheck()
  @ApiOperation({ summary: 'Full health check' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.storage.isHealthy('storage'),
    ]);
  }

  @Get('health/database')
  @HealthCheck()
  @ApiOperation({ summary: 'Database health check' })
  database() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('health/storage')
  @HealthCheck()
  @ApiOperation({ summary: 'Storage health check' })
  storageHealth() {
    return this.health.check([() => this.storage.isHealthy('storage')]);
  }
}
