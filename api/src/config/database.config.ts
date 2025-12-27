import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { toBoolean, toInt } from './transforms';

export class DatabaseConfig {
  @IsString()
  @IsNotEmpty()
  API_DATABASE_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65_535)
  @Transform(({ value }) => toInt(value, 5432))
  API_DATABASE_PORT = 5432;

  @IsString()
  @IsNotEmpty()
  API_DATABASE_NAME: string;

  @IsString()
  @IsNotEmpty()
  API_DATABASE_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf(
    () =>
      process.env.API_ENV === 'production' || process.env.API_ENV === 'staging',
  )
  @MinLength(32)
  API_DATABASE_PASSWORD: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  API_DATABASE_SYNCHRONIZE = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  API_DATABASE_LOGGING = false;
}
