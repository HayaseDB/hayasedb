import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'

config({
  path: fileURLToPath(new URL('../.env.e2e', import.meta.url)),
  quiet: true,
})
config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
  quiet: true,
})

export const E2E_DATABASE_SUFFIX = '_e2e'

const databaseName = process.env.E2E_DATABASE_NAME ?? 'hayasedb_e2e'
if (!databaseName.endsWith(E2E_DATABASE_SUFFIX)) {
  throw new Error(
    `E2E_DATABASE_NAME must end with ${E2E_DATABASE_SUFFIX}, got ${databaseName}`,
  )
}

const databaseUrl = new URL(
  process.env.DATABASE_URL ??
    `postgres://${process.env.POSTGRES_USER ?? 'hayase'}:${process.env.POSTGRES_PASSWORD ?? 'hayase'}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? '5432'}/postgres`,
)
databaseUrl.pathname = `/${databaseName}`
process.env.DATABASE_URL = databaseUrl.toString()

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name} in e2e environment`)
  return value
}

export const env = {
  apiUrl: required('API_PUBLIC_URL'),
  webUrl: required('WEB_PUBLIC_URL'),
  adminUrl: required('ADMIN_PUBLIC_URL'),
  databaseUrl: required('DATABASE_URL'),
  mailpitUrl: required('MAILPIT_URL'),
  internalToken: required('INTERNAL_API_TOKEN'),
  storageLocalRoot: required('STORAGE_LOCAL_ROOT'),
}

export const ADMIN = {
  name: 'E2E Admin',
  email: required('E2E_ADMIN_EMAIL'),
  password: required('E2E_ADMIN_PASSWORD'),
}
