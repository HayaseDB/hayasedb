import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { REQUEST } from '@nestjs/core'
import { ORPCModule } from '@orpc/nest'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import type { Database } from '@hayasedb/db'
import type { Mailer } from '@hayasedb/mail'
import type { Request } from 'express'
import { authFactory } from './auth/auth'
import { ConfigModule } from './config/config.module'
import type { Env } from './config/env.schema'
import { DatabaseModule } from './database/database.module'
import { DRIZZLE } from './database/database.constants'
import { MailModule } from './mail/mail.module'
import { MAILER } from './mail/mail.constants'
import { AccountModule } from './modules/account/account.module'
import { SystemModule } from './modules/system/system.module'
import type { ORPCContext } from './orpc/context'
import { RedisModule } from './redis/redis.module'
import { REDIS } from './redis/redis.constants'
import type { Redis } from './redis/redis.factory'
import { StorageModule } from './storage/storage.module'
import { StorageService } from './storage/storage.service'

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    MailModule,
    ORPCModule.forRootAsync({
      useFactory: (request: Request): { context: ORPCContext } => ({
        context: { request },
      }),
      inject: [REQUEST],
    }),
    AuthModule.forRootAsync({
      imports: [StorageModule],
      inject: [ConfigService, DRIZZLE, REDIS, MAILER, StorageService],
      useFactory: (
        config: ConfigService<Env, true>,
        db: Database,
        redis: Redis,
        mailer: Mailer,
        storage: StorageService,
      ) => ({
        auth: authFactory(config, db, redis, mailer, storage),
        disableTrustedOriginsCors: true,
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
          rawBody: true,
        },
      }),
    }),
    SystemModule,
    AccountModule,
  ],
})
export class AppModule {}
