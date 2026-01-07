import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

import { ContributionSortField } from '../enums/contribution-sort-field.enum';
import { ContributionStatus } from '../enums/contribution-status.enum';
import { EntityType } from '../enums/entity-type.enum';
import { SortOrder } from '../enums/sort-order.enum';

export class QueryContributionsDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by contribution status',
    enum: ContributionStatus,
    example: ContributionStatus.PENDING,
  })
  @IsEnum(ContributionStatus)
  @IsOptional()
  status?: ContributionStatus;

  @ApiPropertyOptional({
    description: 'Filter by target entity type',
    enum: EntityType,
    example: EntityType.ANIME,
  })
  @IsEnum(EntityType)
  @IsOptional()
  target?: EntityType;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ContributionSortField,
    default: ContributionSortField.CREATED_AT,
  })
  @IsEnum(ContributionSortField)
  @IsOptional()
  sort?: ContributionSortField = ContributionSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder = SortOrder.DESC;
}
