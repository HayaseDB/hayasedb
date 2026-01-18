import { ApiProperty } from '@nestjs/swagger';

export class HealthInfoDto {
  @ApiProperty({ description: 'Application name', example: 'hayasedb-api' })
  name: string;

  @ApiProperty({ description: 'Application version', example: '1.0.0' })
  version: string;

  @ApiProperty({
    description: 'Environment',
    example: 'development',
    enum: ['development', 'staging', 'production'],
  })
  environment: string;

  @ApiProperty({ description: 'Uptime in seconds', example: 3600 })
  uptime: number;

  @ApiProperty({
    description: 'Current timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;
}
