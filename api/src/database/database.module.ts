import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DatabaseConfig } from "../config/database.config";

import { AppDataSource } from "./data-source";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseConfig =
          configService.getOrThrow<DatabaseConfig>("database");

        const synchronize = databaseConfig.API_DATABASE_SYNCHRONIZE;

        return {
          ...AppDataSource.options,
          synchronize,
          logging: databaseConfig.API_DATABASE_LOGGING,
          migrationsRun: !synchronize,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}