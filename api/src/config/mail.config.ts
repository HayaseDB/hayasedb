import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { MailProviderType } from '../modules/mail/constants/mail.constants';
import { toBoolean, toInt } from './transforms';

export class MailConfig {
  @IsEnum(MailProviderType)
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value ?? MailProviderType.SMTP)
  API_MAIL_PROVIDER: MailProviderType = MailProviderType.SMTP;

  @IsString()
  @IsNotEmpty()
  API_MAIL_FROM_NAME = 'HayaseDB';

  @IsEmail()
  @IsNotEmpty()
  API_MAIL_FROM_ADDRESS: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  API_MAIL_VERIFY_CONNECTION = false;

  // SMTP Configuration
  @IsString()
  @IsOptional()
  API_SMTP_HOST?: string;

  @IsInt()
  @Min(1)
  @Max(65_535)
  @IsOptional()
  @Transform(({ value }) => toInt(value, 587))
  API_SMTP_PORT = 587;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  API_SMTP_SECURE = false;

  @IsString()
  @IsOptional()
  API_SMTP_USER?: string;

  @IsString()
  @IsOptional()
  API_SMTP_PASS?: string;

  // Resend Configuration
  @IsString()
  @IsOptional()
  API_RESEND_API_KEY?: string;
}
