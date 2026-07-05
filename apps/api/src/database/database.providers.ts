import {
  Inject,
  Injectable,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { schema } from '@hayasedb/db'
import { APP_CONFIG, type AppEnv } from '../config/config.constants'
import { DATABASE_CLIENT, DRIZZLE } from './database.constants'

type PostgresClient = ReturnType<typeof postgres>

export const clientProvider: Provider = {
  provide: DATABASE_CLIENT,
  inject: [APP_CONFIG],
  useFactory: (env: AppEnv): PostgresClient => postgres(env.DATABASE_URL),
}

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [DATABASE_CLIENT],
  useFactory: (client: PostgresClient) => drizzle(client, { schema }),
}

@Injectable()
export class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: PostgresClient,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.end()
  }
}
