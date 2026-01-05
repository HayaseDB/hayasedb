import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGenreDto {
  @ApiProperty({
    description: 'Genre name',
    example: 'Comedy',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @ApiPropertyOptional({
    description: 'Genre description',
    example:
      'Anime that aims to make the audience laugh through humor, jokes, and comedic situations',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
