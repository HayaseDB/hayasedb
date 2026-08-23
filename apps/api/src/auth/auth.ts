import { Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { type Database, schema } from '@hayasedb/db'
import { createAuth } from '@hayasedb/auth'
import type { Mailer } from '@hayasedb/mail'
import { eq } from 'drizzle-orm'
import type { Env } from '../config/env.schema'
import { sharedCookieDomain } from '../config/cookie-domain'
import { trustedOrigins } from '../config/trusted-origins'
import { type Redis, makeRedisSecondaryStorage } from '../redis/redis.factory'

export type Auth = ReturnType<typeof createAuth>

const authLogger = new Logger('Auth')

const formatLogArg = (arg: unknown): string => {
  if (arg instanceof Error) return arg.stack ?? arg.message
  if (typeof arg === 'string') return arg
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

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
  const appURL = config.get('WEB_PUBLIC_URL', { infer: true })
  const production = config.get('NODE_ENV', { infer: true }) === 'production'

  return createAuth({
    db,
    secret: config.get('AUTH_SECRET', { infer: true }),
    appURL,
    trustedOrigins: trustedOrigins(config),
    trustedProxies: config.get('AUTH_TRUSTED_PROXIES', { infer: true }),
    cookieDomain: sharedCookieDomain(config),
    secondaryStorage: makeRedisSecondaryStorage(redis),
    productionMode: production,
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
    logger: {
      level: production ? 'warn' : 'info',
      log: (level, message, ...args) => {
        const line = [message, ...args.map(formatLogArg)].join(' ')
        if (level === 'error') authLogger.error(line)
        else if (level === 'warn') authLogger.warn(line)
        else if (level === 'debug') authLogger.debug(line)
        else authLogger.log(line)
      },
    },
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
