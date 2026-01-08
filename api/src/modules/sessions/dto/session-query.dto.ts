import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import {
  BasePaginationQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';

export enum SessionSortField {
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export { SortOrder };

export class SessionQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Sort field',
    enum: SessionSortField,
    default: SessionSortField.CREATED_AT,
  })
  @IsEnum(SessionSortField)
  @IsOptional()
  sort?: SessionSortField = SessionSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder = SortOrder.DESC;
}
