import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../modules/rbac/decorators/public.decorator';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { HealthInfoDto } from './dto/health-info.dto';
import { HealthService } from './health.service';
import { StorageHealthIndicator } from './indicators/storage.health';

@ApiTags('Health')
@Controller()
@Public()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly storage: StorageHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get application info' })
  @ApiOkResponse({ type: HealthInfoDto })
  info(): HealthInfoDto {
    return this.healthService.getInfo();
  }

  @Get('health/live')
  @HealthCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ description: 'Service is alive' })
  live(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('health/ready')
  @HealthCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiOkResponse({ description: 'Service is ready to accept requests' })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.storage.isHealthy('storage'),
    ]);
  }

  @Get('health')
  @HealthCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Full health check' })
  @ApiOkResponse({ description: 'Full health check status' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.storage.isHealthy('storage'),
    ]);
  }

  @Get('health/database')
  @HealthCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Database health check' })
  @ApiOkResponse({ description: 'Database health status' })
  database(): Promise<HealthCheckResult> {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('health/storage')
  @HealthCheck()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Storage health check' })
  @ApiOkResponse({ description: 'Storage health status' })
  storageHealth(): Promise<HealthCheckResult> {
    return this.health.check([() => this.storage.isHealthy('storage')]);
  }
}
