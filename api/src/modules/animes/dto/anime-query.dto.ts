import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

import {
  BasePaginationQueryDto,
  SortOrder,
} from '../../../common/dto/pagination-query.dto';
import { AnimeFormat } from '../enums/anime-format.enum';
import { AnimeStatus } from '../enums/anime-status.enum';

export enum AnimeSortField {
  TITLE = 'title',
  YEAR = 'year',
  CREATED_AT = 'created_at',
}

export { SortOrder };

export class AnimeQueryDto extends BasePaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by title (partial match)',
    example: 'nagatoro',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by format',
    enum: AnimeFormat,
    example: AnimeFormat.TV,
  })
  @IsEnum(AnimeFormat)
  @IsOptional()
  format?: AnimeFormat;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: AnimeStatus,
    example: AnimeStatus.FINISHED,
  })
  @IsEnum(AnimeStatus)
  @IsOptional()
  status?: AnimeStatus;

  @ApiPropertyOptional({
    description: 'Filter by year',
    example: 2021,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: AnimeSortField,
    default: AnimeSortField.CREATED_AT,
  })
  @IsEnum(AnimeSortField)
  @IsOptional()
  sort?: AnimeSortField = AnimeSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder = SortOrder.DESC;
}
