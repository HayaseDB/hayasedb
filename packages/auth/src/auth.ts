import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { createDb } from '@hayasedb/db'

export interface AuthOptions {
  databaseUrl: string
  secret: string
  baseURL: string
  trustedOrigins?: string[]
}

export function createAuth(opts: AuthOptions) {
  const { db } = createDb(opts.databaseUrl)

  return betterAuth({
    baseURL: opts.baseURL,
    secret: opts.secret,
    trustedOrigins: opts.trustedOrigins ?? [],
    database: drizzleAdapter(db, { provider: 'pg' }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    user: {
      additionalFields: {
        trustTier: {
          type: 'string',
          required: false,
          defaultValue: 'contributor',
          input: false,
        },
      },
    },
    plugins: [admin()],
  })
}

export type Auth = ReturnType<typeof createAuth>
