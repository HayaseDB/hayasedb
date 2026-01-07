import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateContributionDto {
  @ApiProperty({
    description: 'Updated contribution data payload (replaces existing data)',
    example: {
      title: "Frieren: Beyond Journey's End",
      format: 'tv',
      status: 'finished',
      year: 2023,
      genres: [{ name: 'Fantasy' }, { id: 'existing-genre-uuid' }],
    },
  })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Optional note explaining the contribution',
    example: 'Added missing year',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  note?: string;
}
