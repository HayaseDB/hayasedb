import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { createAuth } from './auth'

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) })

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} is not set`)
  }
  return value
}

const trustedOrigins = (process.env.AUTH_TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const auth = createAuth({
  databaseUrl: required('DATABASE_URL'),
  secret: required('AUTH_SECRET'),
  baseURL: required('AUTH_BASE_URL'),
  trustedOrigins,
})
