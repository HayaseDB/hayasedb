import { Module } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { ORPCModule } from '@orpc/nest'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import type { Request } from 'express'
import { auth } from './auth/auth'
import { ConfigModule } from './config/config.module'
import { DatabaseModule } from './database/database.module'
import { DocsModule } from './modules/docs/docs.module'
import { PingModule } from './modules/ping/ping.module'

@Module({
  imports: [
    ConfigModule,
    ORPCModule.forRootAsync({
      useFactory: (request: Request) => ({ context: { request } }),
      inject: [REQUEST],
    }),
    AuthModule.forRoot({
      auth,

      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),
    DatabaseModule,
    DocsModule,
    PingModule,
  ],
})
export class AppModule {}
