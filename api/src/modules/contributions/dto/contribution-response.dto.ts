import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ContributionStatus } from '../enums/contribution-status.enum';
import { EntityType } from '../enums/entity-type.enum';

export class ContributorResponseDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'sebastian' })
  username: string;

  @ApiPropertyOptional({ example: 'Sebastian' })
  firstName: string | null;

  @ApiPropertyOptional({ example: 'Müller' })
  lastName: string | null;
}

export class ContributionResponseDto {
  @ApiProperty({ example: 'contrib_abc123' })
  id: string;

  @ApiProperty({ enum: EntityType, example: EntityType.ANIME })
  target: EntityType;

  @ApiProperty({
    description: 'Contribution data. Has id → update, no id → create.',
    example: {
      id: 'anime_aot_001',
      title: 'Attack on Titan',
      genres: [{ id: 'genre_action' }, { name: 'New Genre' }],
    },
  })
  data: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Fixed title', nullable: true })
  note: string | null;

  @ApiProperty({
    enum: ContributionStatus,
    example: ContributionStatus.PENDING,
  })
  status: ContributionStatus;

  @ApiProperty({ type: () => ContributorResponseDto })
  contributor: ContributorResponseDto;

  @ApiPropertyOptional({ type: () => ContributorResponseDto, nullable: true })
  reviewer: ContributorResponseDto | null;

  @ApiPropertyOptional({
    description: 'Submission date (ISO 8601 UTC)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
    nullable: true,
  })
  submittedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Review date (ISO 8601 UTC)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
    nullable: true,
  })
  reviewedAt: Date | null;

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
