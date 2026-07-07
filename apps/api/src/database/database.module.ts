import { Global, Module } from '@nestjs/common'
import { DATABASE_CLIENT, DRIZZLE } from './database.constants'
import { DatabaseLifecycle, databaseProviders } from './database.providers'

@Global()
@Module({
  providers: [...databaseProviders, DatabaseLifecycle],
  exports: [DATABASE_CLIENT, DRIZZLE],
})
export class DatabaseModule {}
