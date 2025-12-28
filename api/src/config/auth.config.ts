import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthConfig {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message:
      'API_JWT_SECRET must be at least 8 characters. For production/staging, use at least 32 characters. Generate a secure secret with: openssl rand -base64 32',
  })
  API_JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  API_JWT_EXPIRES_IN = '1h';

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message:
      'API_JWT_REFRESH_SECRET must be at least 8 characters. For production/staging, use at least 32 characters. Generate a secure secret with: openssl rand -base64 32',
  })
  API_JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  API_JWT_REFRESH_EXPIRES_IN = '7d';
}
