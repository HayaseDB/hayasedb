import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current password for account deletion confirmation',
    example: 'YourPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
