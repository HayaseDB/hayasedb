import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContributionsController } from './contributions.controller';
import { ContributionsService } from './contributions.service';
import { Contribution } from './entities/contribution.entity';
import { SchemaGeneratorService } from './schema/schema-generator.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contribution])],
  controllers: [ContributionsController],
  providers: [ContributionsService, SchemaGeneratorService],
  exports: [ContributionsService, SchemaGeneratorService],
})
export class ContributionsModule {}
