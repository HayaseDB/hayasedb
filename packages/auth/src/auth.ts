import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, openAPI } from 'better-auth/plugins'
import { PASSWORD_MAX, PASSWORD_MIN } from '@hayasedb/contract'
import type { Database } from '@hayasedb/db'

export interface GithubProviderOptions {
  clientId: string
  clientSecret: string
}

export interface DiscordProviderOptions {
  clientId: string
  clientSecret: string
}

export interface SecondaryStorage {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  increment?(key: string, ttl: number): Promise<number>
  getAndDelete?(key: string): Promise<string | null>
}

export interface AuthMailer {
  sendVerifyEmail(to: string, url: string): Promise<void>
  sendResetPassword(to: string, url: string): Promise<void>
  sendChangeEmail(to: string, url: string): Promise<void>
  sendWelcome(to: string, name?: string): Promise<void>
}

export interface AuthOptions {
  db: Database
  secret: string
  baseURL: string
  frontendBaseURL?: string
  trustedOrigins?: string[]
  secondaryStorage?: SecondaryStorage
  productionMode?: boolean
  github?: GithubProviderOptions
  discord?: DiscordProviderOptions
  errorCallbackURL?: string
  mailer?: AuthMailer
  onDeleteUser?: (user: { id: string; email: string }) => Promise<void> | void
}

export function createAuth(opts: AuthOptions) {
  const production = opts.productionMode ?? false
  const mailer = opts.mailer
  const frontendBaseURL = (
    opts.frontendBaseURL ??
    opts.trustedOrigins?.[0] ??
    opts.baseURL
  ).replace(/\/$/, '')

  const frontendLink = (path: string, token: string): string =>
    `${frontendBaseURL}${path}?token=${encodeURIComponent(token)}`

  const socialProviders = {
    ...(opts.github && {
      github: {
        clientId: opts.github.clientId,
        clientSecret: opts.github.clientSecret,
      },
    }),
    ...(opts.discord && {
      discord: {
        clientId: opts.discord.clientId,
        clientSecret: opts.discord.clientSecret,
      },
    }),
  }

  return betterAuth({
    baseURL: opts.baseURL,
    secret: opts.secret,
    trustedOrigins: opts.trustedOrigins ?? [],
    database: drizzleAdapter(opts.db, { provider: 'pg' }),
    secondaryStorage: opts.secondaryStorage,
    socialProviders: Object.keys(socialProviders).length
      ? socialProviders
      : undefined,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: PASSWORD_MIN,
      maxPasswordLength: PASSWORD_MAX,
      autoSignIn: true,
      sendResetPassword: mailer
        ? ({ user, token }) =>
            mailer.sendResetPassword(
              user.email,
              frontendLink('/auth/reset-password', token),
            )
        : undefined,
    },
    emailVerification: mailer
      ? {
          autoSignInAfterVerification: true,
          sendOnSignUp: true,
          sendVerificationEmail: ({ user, token }) =>
            mailer.sendVerifyEmail(
              user.email,
              frontendLink('/auth/verify-email', token),
            ),
          afterEmailVerification: (user) =>
            mailer.sendWelcome(user.email, user.name),
        }
      : undefined,
    user: {
      changeEmail: {
        enabled: true,
        sendChangeEmailVerification: mailer
          ? ({ newEmail, token }: { newEmail: string; token: string }) =>
              mailer.sendChangeEmail(
                newEmail,
                frontendLink('/auth/change-email', token),
              )
          : undefined,
      },
      deleteUser: {
        enabled: true,
        beforeDelete: opts.onDeleteUser
          ? async (user: { id: string; email: string }) => {
              await opts.onDeleteUser!({ id: user.id, email: user.email })
            }
          : undefined,
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        allowDifferentEmails: true,
        trustedProviders: [],
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
