import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { GenreResponseDto } from '../../genres/dto/genre-response.dto';
import { AnimeFormat } from '../enums/anime-format.enum';
import { AnimeStatus } from '../enums/anime-status.enum';

export class AnimeResponseDto {
  @ApiProperty({
    description: 'Anime ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Anime slug (URL-friendly identifier)',
    example: 'dont-toy-with-me-miss-nagatoro',
  })
  slug: string;

  @ApiProperty({
    description: 'Anime title',
    example: "Don't Toy with Me, Miss Nagatoro",
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Anime synopsis/description',
    example:
      'Naoto Hachioji is a shy and introverted art student who prefers to spend his time alone. One day, he meets Hayase Nagatoro, a mischievous girl who loves to tease and bully him relentlessly, though deep down she has developed feelings for him.',
  })
  synopsis: string | null;

  @ApiProperty({
    description: 'Anime format type',
    enum: AnimeFormat,
    example: AnimeFormat.TV,
  })
  format: AnimeFormat;

  @ApiProperty({
    description: 'Anime airing status',
    enum: AnimeStatus,
    example: AnimeStatus.FINISHED,
  })
  status: AnimeStatus;

  @ApiPropertyOptional({
    description: 'Release year',
    example: 2021,
  })
  year: number | null;

  @ApiPropertyOptional({
    description: 'Genres associated with this anime',
    type: [GenreResponseDto],
  })
  genres?: GenreResponseDto[];

  @ApiProperty({
    description: 'Creation date (ISO 8601 UTC)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date (ISO 8601 UTC)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  updatedAt: Date;
}
