import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import {
  BasePaginationQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';
import { ContributionSortField } from '../enums/contribution-sort-field.enum';
import { ContributionStatus } from '../enums/contribution-status.enum';
import { EntityType } from '../enums/entity-type.enum';

export class QueryContributionsDto extends BasePaginationQueryDto {
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
