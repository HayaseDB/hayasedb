import type { ConfigService } from '@nestjs/config'
import type { Env } from './env.schema'

export function trustedOrigins(config: ConfigService<Env, true>): string[] {
  return [
    ...new Set([
      config.get('API_PUBLIC_URL', { infer: true }),
      config.get('WEB_PUBLIC_URL', { infer: true }),
      config.get('ADMIN_PUBLIC_URL', { infer: true }),
      ...config.get('AUTH_TRUSTED_ORIGINS', { infer: true }),
    ]),
  ]
}
