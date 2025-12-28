import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

import { toEnum, toInt } from './transforms';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

export class AppConfig {
  @IsEnum(Environment)
  @IsOptional()
  @Transform(({ value }) => toEnum(value, Environment, Environment.Development))
  API_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1)
  @Max(65_535)
  @Transform(({ value }) => toInt(value, 3000))
  API_PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_CORS_ORIGIN?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  API_WEB_URL?: string;
}
