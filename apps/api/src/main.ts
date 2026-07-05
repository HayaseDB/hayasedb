import 'reflect-metadata'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { apiReference } from '@scalar/nestjs-api-reference'
import { loadEnv } from '@hayasedb/config/env'
import { runMigrations } from '@hayasedb/db'
import { AppModule } from './app.module'
import { DocsService } from './modules/docs/docs.service'

async function bootstrap() {
  const env = loadEnv()

  await runMigrations(env.DATABASE_URL)

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  })
  app.enableShutdownHooks()
  app.enableCors({
    origin: env.AUTH_TRUSTED_ORIGINS_LIST,
    credentials: true,
  })

  const spec = await app.get(DocsService).getSpec()
  app.use('/docs', apiReference({ content: spec }))

  await app.listen(env.API_PORT, env.API_HOST)
  Logger.log(`listening on http://${env.API_HOST}:${env.API_PORT}`, 'Bootstrap')
}

void bootstrap()
