import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

class SessionInfoDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

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

  @ApiProperty({ description: 'Is this the current session' })
  isCurrent: boolean;
}

export class CurrentUserResponseDto {
  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;

  @ApiProperty({
    description: 'Current session information',
    type: SessionInfoDto,
  })
  session: SessionInfoDto;
}
