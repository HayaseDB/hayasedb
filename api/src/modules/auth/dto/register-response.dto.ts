import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Verification email sent. Please check your inbox.',
  })
  message: string;
}
