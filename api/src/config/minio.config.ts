import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { toInt } from './transforms';

export class MinioConfig {
  @IsString()
  @IsNotEmpty()
  API_MINIO_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65_535)
  @Transform(({ value }) => toInt(value, 9000))
  API_MINIO_PORT = 9000;

  @IsString()
  @IsNotEmpty()
  API_MINIO_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf(
    () =>
      process.env.API_ENV === 'production' || process.env.API_ENV === 'staging',
  )
  @MinLength(8)
  API_MINIO_SECRET_KEY: string;
}
