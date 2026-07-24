import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { runMigrations } from '@hayasedb/db'
import { AppModule } from './app.module'
import type { Auth } from './auth/auth'
import type { Env } from './config/env.schema'
import { trustedOrigins } from './config/trusted-origins'
import { startDraining } from './modules/health/shutdown-state'
import { buildOpenApiSources } from './openapi'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })
  const config = app.get<ConfigService<Env, true>>(ConfigService)

  try {
    await runMigrations(config.get('DATABASE_URL', { infer: true }))
  } catch (error) {
    Logger.error(
      'Database migration failed',
      error instanceof Error ? error.stack : String(error),
      'Migrations',
    )
    throw error
  }

  app.setGlobalPrefix('api')
  app.enableShutdownHooks(['SIGINT'])

  const drainMs = Number(process.env.SHUTDOWN_DRAIN_MS ?? 0)
  process.once('SIGTERM', () => {
    startDraining()
    Logger.log(`SIGTERM received, draining for ${drainMs}ms`, 'Shutdown')
    setTimeout(() => {
      app.close().then(
        () => process.exit(0),
        () => process.exit(1),
      )
    }, drainMs)
  })
  app.enableCors({
    origin: trustedOrigins(config),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  const authApi = app.get<AuthService<Auth>>(AuthService).api
  const sources = await buildOpenApiSources(
    authApi,
    config.get('API_PUBLIC_URL', { infer: true }),
  )
  app.use('/docs', apiReference({ showDeveloperTools: 'never', sources }))

  const host = config.get('API_HOST', { infer: true })
  const port = config.get('API_PORT', { infer: true })
  await app.listen(port, host)
  Logger.log(`listening on http://${host}:${port}`, 'Bootstrap')
}

bootstrap().catch((error) => {
  Logger.error(error, 'Bootstrap')
  process.exit(1)
})
