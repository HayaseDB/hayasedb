import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, openAPI } from 'better-auth/plugins'
import type { SecondaryStorage } from '@hayasedb/core'
import type { Database } from '@hayasedb/db'

export interface GithubProviderOptions {
  clientId: string
  clientSecret: string
}

export interface AuthOptions {
  db: Database
  secret: string
  baseURL: string
  trustedOrigins?: string[]
  secondaryStorage?: SecondaryStorage
  productionMode?: boolean
  github?: GithubProviderOptions
  errorCallbackURL?: string
}

export function createAuth(opts: AuthOptions) {
  const production = opts.productionMode ?? false

  return betterAuth({
    baseURL: opts.baseURL,
    secret: opts.secret,
    trustedOrigins: opts.trustedOrigins ?? [],
    database: drizzleAdapter(opts.db, { provider: 'pg' }),
    secondaryStorage: opts.secondaryStorage,
    socialProviders: opts.github
      ? {
          github: {
            clientId: opts.github.clientId,
            clientSecret: opts.github.clientSecret,
          },
        }
      : undefined,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    account: {
      accountLinking: {
        enabled: true,
        allowDifferentEmails: false,
        trustedProviders: opts.github ? ['github'] : [],
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 60 * 24,
      storeSessionInDatabase: true,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    rateLimit: {
      enabled: true,
      window: 10,
      max: 100,
      storage: opts.secondaryStorage ? 'secondary-storage' : 'memory',
    },
    advanced: {
      useSecureCookies: production,
    },
    onAPIError: opts.errorCallbackURL
      ? { errorURL: opts.errorCallbackURL }
      : undefined,
    plugins: [admin(), openAPI({ disableDefaultReference: true })],
  })
}

export type Auth = ReturnType<typeof createAuth>
