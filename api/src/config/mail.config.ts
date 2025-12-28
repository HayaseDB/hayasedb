import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { toBoolean, toInt } from './transforms';

export class MailConfig {
  @IsString()
  @IsNotEmpty()
  API_MAIL_FROM_NAME = 'HayaseDB';

  @IsEmail()
  @IsNotEmpty()
  API_MAIL_FROM_ADDRESS: string;

  @IsString()
  @IsOptional()
  API_MAIL_HOST?: string;

  @IsInt()
  @Min(1)
  @Max(65_535)
  @IsOptional()
  @Transform(({ value }) => toInt(value, 587))
  API_MAIL_PORT = 587;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  API_MAIL_SECURE = false;

  @IsString()
  @IsOptional()
  API_MAIL_USER?: string;

  @IsString()
  @IsOptional()
  API_MAIL_PASSWORD?: string;
}
