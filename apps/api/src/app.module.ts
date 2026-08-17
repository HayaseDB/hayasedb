import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, REQUEST } from '@nestjs/core'
import { ORPCModule } from '@orpc/nest'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth'
import type { Database } from '@hayasedb/db'
import type { Mailer } from '@hayasedb/mail'
import type { Request } from 'express'
import { ApiAccessGuard } from './auth/api-access.guard'
import { authFactory } from './auth/auth'
import { BetterAuthErrorFilter } from './auth/better-auth-error.filter'
import { throttlerOptions } from './auth/throttler'
import { RedisThrottlerStorage } from './redis/throttler-storage'
import { ConfigModule } from './config/config.module'
import type { Env } from './config/env.schema'
import { DatabaseModule } from './database/database.module'
import { DRIZZLE } from './database/database.constants'
import { MailModule } from './mail/mail.module'
import { MAILER } from './mail/mail.constants'
import { AccountModule } from './modules/account/account.module'
import { AnimeModule } from './modules/anime/anime.module'
import { GenreModule } from './modules/genre/genre.module'
import { ModerationModule } from './modules/moderation/moderation.module'
import { HealthModule } from './modules/health/health.module'
import { SystemModule } from './modules/system/system.module'
import type { ORPCContext } from './orpc/context'
import { RedisModule } from './redis/redis.module'
import { REDIS } from './redis/redis.constants'
import type { Redis } from './redis/redis.factory'

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
      inject: [ConfigService, DRIZZLE, REDIS, MAILER],
      useFactory: (
        config: ConfigService<Env, true>,
        db: Database,
        redis: Redis,
        mailer: Mailer,
      ) => ({
        auth: authFactory(config, db, redis, mailer),
        disableGlobalAuthGuard: true,
        disableTrustedOriginsCors: true,
        bodyParser: {
          json: { limit: '2mb', type: ['application/json', 'text/plain'] },
          urlencoded: { limit: '2mb', extended: true },
          rawBody: true,
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [RedisThrottlerStorage],
      useFactory: throttlerOptions,
    }),
    HealthModule,
    SystemModule,
    AccountModule,
    AnimeModule,
    GenreModule,
    ModerationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ApiAccessGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: BetterAuthErrorFilter },
  ],
})
export class AppModule {}
