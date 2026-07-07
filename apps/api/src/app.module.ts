import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { REQUEST } from '@nestjs/core'
import { ORPCModule } from '@orpc/nest'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import type { Redis } from '@hayasedb/core'
import type { Database } from '@hayasedb/db'
import type { Request } from 'express'
import { authFactory } from './auth/auth'
import { ConfigModule } from './config/config.module'
import type { Env } from './config/env.schema'
import { DatabaseModule } from './database/database.module'
import { DRIZZLE } from './database/database.constants'
import { DocsModule } from './modules/docs/docs.module'
import { MeModule } from './modules/me/me.module'
import { PingModule } from './modules/ping/ping.module'
import type { ORPCContext } from './orpc/context'
import { RedisModule } from './redis/redis.module'
import { REDIS } from './redis/redis.constants'

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    RedisModule,
    ORPCModule.forRootAsync({
      useFactory: (request: Request): { context: ORPCContext } => ({
        context: {
          request,
          session: request.session,
          user: request.user,
        },
      }),
      inject: [REQUEST],
    }),
    AuthModule.forRootAsync({
      inject: [ConfigService, DRIZZLE, REDIS],
      useFactory: (
        config: ConfigService<Env, true>,
        db: Database,
        redis: Redis,
      ) => ({
        auth: authFactory(config, db, redis),
        disableTrustedOriginsCors: true,
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
          rawBody: true,
        },
      }),
    }),
    DocsModule,
    MeModule,
    PingModule,
  ],
})
export class AppModule {}
