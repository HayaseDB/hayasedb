import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { StorageHealthIndicator } from './indicators/storage.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [HealthService, StorageHealthIndicator],
})
export class HealthModule {}
