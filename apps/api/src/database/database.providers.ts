import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type DbClient, type Database, createDb } from '@hayasedb/db'
import type { Env } from '../config/env.schema'
import {
  DATABASE_CLIENT,
  DATABASE_CONNECTION,
  DRIZZLE,
} from './database.constants'

type Connection = { db: Database; client: DbClient }

const connectionProvider: Provider = {
  provide: DATABASE_CONNECTION,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): Connection => {
    const logger = new Logger('Database')
    return createDb(config.get('DATABASE_URL', { infer: true }), {
      onError: (error) => logger.error(error.message, error.stack),
    })
  },
}

const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [DATABASE_CONNECTION],
  useFactory: (connection: Connection): Database => connection.db,
}

const clientProvider: Provider = {
  provide: DATABASE_CLIENT,
  inject: [DATABASE_CONNECTION],
  useFactory: (connection: Connection): DbClient => connection.client,
}

export const databaseProviders = [
  connectionProvider,
  drizzleProvider,
  clientProvider,
]

@Injectable()
export class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_CLIENT) private readonly client: DbClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end()
  }
}
