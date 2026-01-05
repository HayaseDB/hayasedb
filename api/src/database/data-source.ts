process.env.DOTENV_CONFIG_QUIET = 'true';

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DataSource } from 'typeorm';

import { DatabaseConfig } from '../config/database.config';

function validateDatabaseConfig(): DatabaseConfig {
  const databaseConfig = plainToInstance(DatabaseConfig, process.env, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });

  const errors = validateSync(databaseConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    console.error('TypeORM CLI Configuration Validation Failed');

    for (const error of errors) {
      const messages = error.constraints
        ? Object.values(error.constraints)
        : ['Invalid value'];

      const value: unknown =
        error.value === undefined ? 'undefined' : error.value;
      const valueDisplay =
        typeof value === 'string' ? `"${value}"` : String(value);

      console.error(`  ${error.property} = ${valueDisplay}`);

      for (const message of messages) {
        console.error(` - ${message}`);
      }

      console.error('');
    }

    throw new Error('Database Configuration Validation Failed');
  }

  return databaseConfig;
}

const databaseConfig = validateDatabaseConfig();

const isCompiled = __filename.endsWith('.js');
const baseDirection = isCompiled ? 'dist' : 'src';
const extension = isCompiled ? '.js' : '.ts';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: databaseConfig.API_DATABASE_HOST,
  port: databaseConfig.API_DATABASE_PORT,
  username: databaseConfig.API_DATABASE_USERNAME,
  password: databaseConfig.API_DATABASE_PASSWORD,
  database: databaseConfig.API_DATABASE_NAME,
  entities: [`${baseDirection}/**/entities/*.entity${extension}`],
  migrations: [`${baseDirection}/**/database/migrations/*${extension}`],
  synchronize: false,
  logging: databaseConfig.API_DATABASE_LOGGING,
});
