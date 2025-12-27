import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { toBoolean } from './transforms';

export class SwaggerConfig {
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, true))
  API_SWAGGER_ENABLED = true;

  @IsString()
  @IsOptional()
  API_SWAGGER_PATH = 'docs';
}
