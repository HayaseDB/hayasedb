import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email address to resend verification to',
    example: 'user@example.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
