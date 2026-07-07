import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { apiReference } from '@scalar/nestjs-api-reference'
import { runMigrations } from '@hayasedb/db'
import { AppModule } from './app.module'
import type { Env } from './config/env.schema'
import { DocsService } from './modules/docs/docs.service'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })
  const config = app.get<ConfigService<Env, true>>(ConfigService)

  await runMigrations(config.get('DATABASE_URL', { infer: true }))

  app.setGlobalPrefix('api')
  app.enableShutdownHooks()
  app.enableCors({
    origin: config.get('AUTH_TRUSTED_ORIGINS', { infer: true }),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  const spec = await app.get(DocsService).getSpec()
  app.use('/docs', apiReference({ content: spec }))

  const host = config.get('API_HOST', { infer: true })
  const port = config.get('API_PORT', { infer: true })
  await app.listen(port, host)
  Logger.log(`listening on http://${host}:${port}`, 'Bootstrap')
}

bootstrap().catch((error) => {
  Logger.error(error, 'Bootstrap')
  process.exit(1)
})
