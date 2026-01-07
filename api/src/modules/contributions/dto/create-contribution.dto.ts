import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { EntityType } from '../enums/entity-type.enum';

export class CreateContributionDto {
  @ApiProperty({
    description: 'Target entity type',
    enum: EntityType,
    example: EntityType.ANIME,
  })
  @IsEnum(EntityType)
  @IsNotEmpty()
  target: EntityType;

  @ApiProperty({
    description:
      'Contribution data. If data.id exists → update, otherwise → create. Nested objects follow the same rule.',
    example: {
      title: "Frieren: Beyond Journey's End",
      format: 'tv',
      status: 'finished',
      genres: [{ name: 'Fantasy' }, { id: 'existing-genre-uuid' }],
    },
  })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Optional note explaining the contribution',
    example: 'Adding missing anime entry',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  note?: string;
}
