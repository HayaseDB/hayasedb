import { Global, Module } from '@nestjs/common'
import { DATABASE_CLIENT, DRIZZLE } from './database.constants'
import {
  DatabaseLifecycle,
  clientProvider,
  drizzleProvider,
} from './database.providers'

@Global()
@Module({
  providers: [clientProvider, drizzleProvider, DatabaseLifecycle],
  exports: [DATABASE_CLIENT, DRIZZLE],
})
export class DatabaseModule {}
