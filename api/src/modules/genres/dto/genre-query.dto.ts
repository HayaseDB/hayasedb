import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum GenreSortField {
  NAME = 'name',
  CREATED_AT = 'created_at',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GenreQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
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
    description: 'Items per page',
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
