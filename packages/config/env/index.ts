import * as z from 'zod'
import { rawEnvSchema, type RawEnv } from './schema'
import { readSecret } from './read-secret'
import { loadDotenv } from './load-dotenv'

const SECRET_KEYS = [
  'POSTGRES_PASSWORD',
  'AUTH_SECRET',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
] as const

function composeDatabaseUrl(e: RawEnv): string {
  if (e.DATABASE_URL) return e.DATABASE_URL
  const user = encodeURIComponent(e.POSTGRES_USER)
  const pass = encodeURIComponent(e.POSTGRES_PASSWORD)
  return `postgres://${user}:${pass}@${e.POSTGRES_HOST}:${e.POSTGRES_PORT}/${e.POSTGRES_DB}`
}

function composeRedisUrl(e: RawEnv): string {
  return e.REDIS_URL ?? `redis://${e.REDIS_HOST}:${e.REDIS_PORT}`
}

export interface AppEnv extends RawEnv {
  DATABASE_URL: string
  REDIS_URL: string
  AUTH_BASE_URL: string
  AUTH_TRUSTED_ORIGINS_LIST: string[]
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  if (source === process.env) loadDotenv()

  const resolved: NodeJS.ProcessEnv = { ...source }
  for (const key of SECRET_KEYS) {
    const value = readSecret(source, key)
    if (value !== undefined) resolved[key] = value
  }

  const parsed = rawEnvSchema.safeParse(resolved)
  if (!parsed.success) {
    const issues = z.prettifyError(parsed.error)
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }

  const e = parsed.data
  const env: AppEnv = {
    ...e,
    DATABASE_URL: composeDatabaseUrl(e),
    REDIS_URL: composeRedisUrl(e),
    AUTH_BASE_URL: e.AUTH_BASE_URL ?? e.API_PUBLIC_URL,
    AUTH_TRUSTED_ORIGINS_LIST: e.AUTH_TRUSTED_ORIGINS.split(',')
      .map((o: string) => o.trim())
      .filter(Boolean),
  }

  return Object.freeze(env)
}

export { rawEnvSchema } from './schema'
export type { RawEnv } from './schema'
export { readSecret } from './read-secret'
export { loadDotenv } from './load-dotenv'
