import type { ConfigService } from '@nestjs/config'
import { type Redis, makeRedisSecondaryStorage } from '@hayasedb/core'
import type { Database } from '@hayasedb/db'
import { createAuth } from '@hayasedb/auth'
import type { Env } from '../config/env.schema'

export type Auth = ReturnType<typeof createAuth>

export function authFactory(
  config: ConfigService<Env, true>,
  db: Database,
  redis: Redis,
): Auth {
  const githubClientId = config.get('GITHUB_CLIENT_ID', { infer: true })
  const githubClientSecret = config.get('GITHUB_CLIENT_SECRET', { infer: true })
  const [webOrigin] = config.get('AUTH_TRUSTED_ORIGINS', { infer: true })

  return createAuth({
    db,
    secret: config.get('AUTH_SECRET', { infer: true }),
    baseURL: config.get('AUTH_BASE_URL', { infer: true }),
    trustedOrigins: config.get('AUTH_TRUSTED_ORIGINS', { infer: true }),
    secondaryStorage: makeRedisSecondaryStorage(redis),
    productionMode: config.get('NODE_ENV', { infer: true }) === 'production',
    errorCallbackURL: webOrigin ? `${webOrigin}/login` : undefined,
    github:
      githubClientId && githubClientSecret
        ? { clientId: githubClientId, clientSecret: githubClientSecret }
        : undefined,
  })
}
