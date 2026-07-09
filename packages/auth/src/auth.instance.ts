import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { createDb } from '@hayasedb/db'
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

const { db } = createDb(required('DATABASE_URL'))

export const auth = createAuth({
  db,
  secret: required('AUTH_SECRET'),
  baseURL: required('API_PUBLIC_URL'),
  trustedOrigins,
})
