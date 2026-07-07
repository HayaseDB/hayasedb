import type { ConfigService } from '@nestjs/config'
import { createAuth } from '@hayasedb/auth'
import type { Env } from '../config/env.schema'

export type Auth = ReturnType<typeof createAuth>

export function authFactory(config: ConfigService<Env, true>): Auth {
  return createAuth({
    databaseUrl: config.get('DATABASE_URL', { infer: true }),
    secret: config.get('AUTH_SECRET', { infer: true }),
    baseURL: config.get('AUTH_BASE_URL', { infer: true }),
    trustedOrigins: config.get('AUTH_TRUSTED_ORIGINS', { infer: true }),
  })
}
