import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
