import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import {
  BasePaginationQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';

export enum GenreSortField {
  NAME = 'name',
  CREATED_AT = 'created_at',
}

export { SortOrder };

export class GenreQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name (partial match)',
    example: 'comedy',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: GenreSortField,
    default: GenreSortField.NAME,
  })
  @IsEnum(GenreSortField)
  @IsOptional()
  sort?: GenreSortField = GenreSortField.NAME;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder = SortOrder.ASC;
}
