import { Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { type Database, schema } from '@hayasedb/db'
import { createAuth } from '@hayasedb/auth'
import type { Mailer } from '@hayasedb/mail'
import { eq } from 'drizzle-orm'
import type { Env } from '../config/env.schema'
import { type Redis, makeRedisSecondaryStorage } from '../redis/redis.factory'

export type Auth = ReturnType<typeof createAuth>

const authLogger = new Logger('AuthDeleteUser')

export function authFactory(
  config: ConfigService<Env, true>,
  db: Database,
  redis: Redis,
  mailer: Mailer,
): Auth {
  const githubClientId = config.get('GITHUB_CLIENT_ID', { infer: true })
  const githubClientSecret = config.get('GITHUB_CLIENT_SECRET', { infer: true })
  const discordClientId = config.get('DISCORD_CLIENT_ID', { infer: true })
  const discordClientSecret = config.get('DISCORD_CLIENT_SECRET', {
    infer: true,
  })
  const apiURL = config.get('API_PUBLIC_URL', { infer: true })
  const trustedOrigins = [
    ...new Set([
      ...config.get('AUTH_TRUSTED_ORIGINS', { infer: true }),
      apiURL,
    ]),
  ]

  const appURL = config.get('WEB_PUBLIC_URL', { infer: true })

  return createAuth({
    db,
    secret: config.get('AUTH_SECRET', { infer: true }),
    appURL,
    trustedOrigins,
    trustedProxies: config.get('AUTH_TRUSTED_PROXIES', { infer: true }),
    secondaryStorage: makeRedisSecondaryStorage(redis),
    productionMode: config.get('NODE_ENV', { infer: true }) === 'production',
    errorCallbackURL: `${appURL}/login`,
    github:
      githubClientId && githubClientSecret
        ? { clientId: githubClientId, clientSecret: githubClientSecret }
        : undefined,
    discord:
      discordClientId && discordClientSecret
        ? { clientId: discordClientId, clientSecret: discordClientSecret }
        : undefined,
    mailer,
    onDeleteUser: async ({ id }) => {
      try {
        await db
          .delete(schema.userAvatar)
          .where(eq(schema.userAvatar.userId, id))
      } catch (error) {
        authLogger.error(
          `Failed to remove avatar links for deleted user ${id}`,
          error instanceof Error ? error.stack : String(error),
        )
      }
    },
  })
}
