import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveContributionDto {
  @ApiPropertyOptional({
    description:
      'Note explaining the approval or rejection (required for rejection)',
    example: 'Looks good, approved!',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  note?: string;
}
