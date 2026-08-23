import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { apiReference } from '@scalar/nestjs-api-reference'
import { runMigrations } from '@hayasedb/db'
import { AppModule } from './app.module'
import type { Env } from './config/env.schema'
import { configureApp } from './configure-app'
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

  configureApp(app, config)

  const sources = await buildOpenApiSources(
    config.get('API_PUBLIC_URL', { infer: true }),
    config.get('NODE_ENV', { infer: true }) !== 'production',
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
