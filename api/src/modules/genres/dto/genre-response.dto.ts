import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenreCreatedByUserDto {
  @ApiProperty({
    description: 'User ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'admin',
  })
  username: string;
}

export class GenreResponseDto {
  @ApiProperty({
    description: 'Genre ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Genre slug (URL-friendly identifier)',
    example: 'comedy',
  })
  slug: string;

  @ApiProperty({
    description: 'Genre name',
    example: 'Comedy',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Genre description',
    example:
      'Anime that aims to make the audience laugh through humor, jokes, and comedic situations',
  })
  description: string | null;

  @ApiProperty({
    description: 'Entity version (incremented on each update)',
    example: 1,
  })
  version: number;

  @ApiPropertyOptional({
    description: 'User who created this genre entry',
    type: GenreCreatedByUserDto,
  })
  createdByUser: GenreCreatedByUserDto | null;

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
