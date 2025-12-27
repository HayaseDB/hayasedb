import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

import { AppConfig } from './app.config';
import { DatabaseConfig } from './database.config';
import { SwaggerConfig } from './swagger.config';

interface ConfigValidationError {
  configName: string;
  errors: ValidationError[];
}

const validationErrors: ConfigValidationError[] = [];

function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((error) => {
      const messages = error.constraints
        ? Object.values(error.constraints)
        : ['Invalid value'];

      const value: unknown =
        error.value === undefined ? 'undefined' : error.value;

      let valueDisplay: string;
      if (typeof value === 'string') {
        valueDisplay = `"${value}"`;
      } else if (value === null) {
        valueDisplay = 'null';
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        valueDisplay = String(value);
      } else {
        valueDisplay = JSON.stringify(value);
      }

      const header = `  ${error.property} = ${valueDisplay}`;
      const messageList = messages
        .map((message) => `   - ${message}`)
        .join('\n');

      return `${header}\n${messageList}`;
    })
    .join('\n\n');
}

function createConfigLoader<T extends object>(
  ConfigClass: new () => T,
  configName: string,
) {
  return () => {
    const config = plainToInstance(ConfigClass, process.env, {
      enableImplicitConversion: false,
      exposeDefaultValues: true,
    });

    const errors = validateSync(config, { skipMissingProperties: false });

    if (errors.length > 0) {
      validationErrors.push({ configName, errors });
    }

    return { [configName]: config };
  };
}

function checkAllValidationErrors(): void {
  if (validationErrors.length === 0) {
    return;
  }

  const totalErrors = validationErrors.reduce(
    (sum, { errors }) => sum + errors.length,
    0,
  );

  console.error('Configuration Validation Failed');
  console.error(
    `Found ${totalErrors} validation error(s) across ${validationErrors.length} configuration section(s):\n`,
  );

  for (const { configName, errors } of validationErrors) {
    console.error(`[${configName}] - ${errors.length} error(s)`);
    console.error(formatValidationErrors(errors));
    console.error('');
  }

  throw new Error('Configuration Validation Failed');
}

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: `${__dirname}/../../../.env`,
      load: [
        createConfigLoader(AppConfig, 'app'),
        createConfigLoader(DatabaseConfig, 'database'),
        createConfigLoader(SwaggerConfig, 'swagger'),
        () => {
          checkAllValidationErrors();
          return {};
        },
      ],
    }),
  ],
})
export class ConfigModule {}
