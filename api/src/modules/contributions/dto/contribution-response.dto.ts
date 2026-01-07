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

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  submittedAt: Date | null;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  reviewedAt: Date | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: Date;
}
