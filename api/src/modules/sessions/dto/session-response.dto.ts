import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { DeviceType } from '../../../common/types/request-metadata.interface';

export class SessionResponseDto {
  @ApiProperty({
    description: 'Session ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Browser name',
    example: 'Chrome',
  })
  browser: string | null;

  @ApiPropertyOptional({
    description: 'Browser version',
    example: '120.0.0',
  })
  browserVersion: string | null;

  @ApiPropertyOptional({
    description: 'Operating system',
    example: 'Windows',
  })
  os: string | null;

  @ApiPropertyOptional({
    description: 'Operating system version',
    example: '10',
  })
  osVersion: string | null;

  @ApiProperty({
    description: 'Device type',
    enum: DeviceType,
    example: DeviceType.DESKTOP,
  })
  deviceType: DeviceType;

  @ApiPropertyOptional({
    description: 'IP address',
    example: '192.168.1.1',
  })
  ipAddress: string | null;

  @ApiProperty({
    description: 'Session creation date (ISO 8601 UTC)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Session last update date (ISO 8601 UTC)',
    example: '2024-01-15T10:30:00.000Z',
    type: String,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether this is the current session',
    example: true,
  })
  isCurrent: boolean;
}
