import { Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { API_KEY_HEADER } from '@hayasedb/contract'
import type { Env } from './config/env.schema'
import { trustedOrigins } from './config/trusted-origins'

export function configureApp(
  app: NestExpressApplication,
  config: ConfigService<Env, true>,
) {
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()

  app.useBodyParser('json', {
    limit: '2mb',
    type: ['application/json', 'text/plain'],
  })
  app.useBodyParser('urlencoded', { limit: '2mb', extended: true })

  const trustedProxies = config.get('AUTH_TRUSTED_PROXIES', { infer: true })
  if (trustedProxies.length > 0) {
    app.set('trust proxy', trustedProxies)
  }

  if (config.get('INTERNAL_API_TOKEN', { infer: true }).length === 0) {
    Logger.warn(
      'INTERNAL_API_TOKEN is unset: every request is treated as internal and the API key requirement is disabled',
      'Bootstrap',
    )
  }

  app.enableCors({
    origin: trustedOrigins(config),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', API_KEY_HEADER],
  })

  return app
}
