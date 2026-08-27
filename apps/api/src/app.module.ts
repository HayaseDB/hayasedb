import { Logger, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, REQUEST } from '@nestjs/core'
import { ORPCModule } from '@orpc/nest'
import { ORPCError, onError } from '@orpc/server'
import {
  ResponseHeadersHandlerPlugin,
  RethrowHandlerPlugin,
} from '@orpc/server/plugins'
import { ThrottlerModule } from '@nestjs/throttler'
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth'
import type { Database } from '@hayasedb/db'
import type { Mailer } from '@hayasedb/mail'
import type { Request } from 'express'
import { ApiAccessGuard } from './auth/api-access.guard'
import { RateLimitGuard } from './auth/rate-limit.guard'
import { KeyLimitCache } from './auth/key-limit-cache'
import { KeyLimitModule } from './auth/key-limit.module'
import { KeyLimitInterceptor } from './auth/key-limit.interceptor'
import { HttpExceptionFilter } from './orpc/http-exception.filter'
import { applyCachePolicy } from './orpc/cache-policy'
import { ConditionalRequestInterceptor } from './http/cache.interceptor'
import { mapAuthError } from './auth/map-auth-error'
import { authFactory } from './auth/auth'
import { throttlerOptions } from './auth/throttler'
import { RedisThrottlerStorage } from './redis/throttler-storage'
import { ConfigModule } from './config/config.module'
import type { Env } from './config/env.schema'
import { DatabaseModule } from './database/database.module'
import { DRIZZLE } from './database/database.constants'
import { MailModule } from './mail/mail.module'
import { StorageModule } from './storage/storage.module'
import { MAILER } from './mail/mail.constants'
import { AccountModule } from './modules/account/account.module'
import { AuthApiModule } from './modules/auth/auth.module'
import { AnimeModule } from './modules/anime/anime.module'
import { GenreModule } from './modules/genre/genre.module'
import { ModerationModule } from './modules/moderation/moderation.module'
import { HealthModule } from './modules/health/health.module'
import { SystemModule } from './modules/system/system.module'
import type { ORPCContext } from './orpc/context'
import { RedisModule } from './redis/redis.module'
import { REDIS } from './redis/redis.constants'
import type { Redis } from './redis/redis.factory'

const orpcLogger = new Logger('ORPC')

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    MailModule,
    StorageModule,
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => ({
        context: { request } satisfies ORPCContext,
        interceptors: [
          applyCachePolicy,
          onError((error) => {
            if (error instanceof ORPCError) return
            const mapped = mapAuthError(error)
            if (mapped) throw mapped
            orpcLogger.error(
              error instanceof Error ? error.message : String(error),
              error instanceof Error ? error.stack : undefined,
            )
            throw new ORPCError('INTERNAL_SERVER_ERROR')
          }),
        ],
        plugins: [
          new ResponseHeadersHandlerPlugin(),
          new RethrowHandlerPlugin({
            filter: (error) => !(error instanceof ORPCError),
          }),
        ],
      }),
      inject: [REQUEST],
    }),
    AuthModule.forRootAsync({
      disableControllers: true,
      disableGlobalAuthGuard: true,
      inject: [ConfigService, DRIZZLE, REDIS, MAILER],
      useFactory: (
        config: ConfigService<Env, true>,
        db: Database,
        redis: Redis,
        mailer: Mailer,
      ) => ({
        auth: authFactory(config, db, redis, mailer),
        disableTrustedOriginsCors: true,
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [KeyLimitModule],
      inject: [RedisThrottlerStorage, KeyLimitCache],
      useFactory: throttlerOptions,
    }),
    KeyLimitModule,
    HealthModule,
    SystemModule,
    AccountModule,
    AuthApiModule,
    AnimeModule,
    GenreModule,
    ModerationModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ConditionalRequestInterceptor },
    { provide: APP_INTERCEPTOR, useClass: KeyLimitInterceptor },
    { provide: APP_GUARD, useClass: ApiAccessGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
