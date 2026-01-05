import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MediaResponseDto } from '../../media/dto/media-response.dto';
import { Role } from '../../rbac/enums/role.enum';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description: 'Account creation date (ISO 8601 UTC)',
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

  @ApiPropertyOptional({
    description: 'User profile picture',
    type: MediaResponseDto,
    nullable: true,
  })
  profilePicture: MediaResponseDto | null;
}
