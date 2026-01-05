import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { AnimeFormat } from '../enums/anime-format.enum';
import { AnimeStatus } from '../enums/anime-status.enum';

export class UpdateAnimeDto {
  @ApiPropertyOptional({
    description: 'Anime title',
    example: "Don't Toy with Me, Miss Nagatoro",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title?: string;

  @ApiPropertyOptional({
    description: 'Anime synopsis/description',
    example:
      'Naoto Hachioji is a shy and introverted art student who prefers to spend his time alone. One day, he meets Hayase Nagatoro, a mischievous girl who loves to tease and bully him relentlessly, though deep down she has developed feelings for him.',
    maxLength: 10000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10000)
  synopsis?: string;

  @ApiPropertyOptional({
    description: 'Anime format type',
    enum: AnimeFormat,
    example: AnimeFormat.TV,
  })
  @IsEnum(AnimeFormat)
  @IsOptional()
  format?: AnimeFormat;

  @ApiPropertyOptional({
    description: 'Anime airing status',
    enum: AnimeStatus,
    example: AnimeStatus.FINISHED,
  })
  @IsEnum(AnimeStatus)
  @IsOptional()
  status?: AnimeStatus;

  @ApiPropertyOptional({
    description: 'Release year (1900-2100)',
    example: 2021,
    minimum: 1900,
    maximum: 2100,
  })
  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    description: 'Genre IDs to associate with this anime (replaces existing)',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  genreIds?: string[];
}
