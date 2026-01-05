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

const isMinioProvider = () => process.env.API_STORAGE_PROVIDER !== 'local';

export class MinioConfig {
  @ValidateIf(isMinioProvider)
  @IsString()
  @IsNotEmpty()
  API_MINIO_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65_535)
  @Transform(({ value }) => toInt(value, 9000))
  @IsOptional()
  API_MINIO_PORT = 9000;

  @ValidateIf(isMinioProvider)
  @IsString()
  @IsNotEmpty()
  API_MINIO_ACCESS_KEY: string;

  @ValidateIf(isMinioProvider)
  @IsString()
  @IsNotEmpty()
  @ValidateIf(
    () =>
      process.env.API_ENV === 'production' || process.env.API_ENV === 'staging',
  )
  @MinLength(8)
  API_MINIO_SECRET_KEY: string;

  @IsBoolean()
  @Transform(({ value }) => toBoolean(value, false))
  @IsOptional()
  API_MINIO_USE_SSL = false;
}
