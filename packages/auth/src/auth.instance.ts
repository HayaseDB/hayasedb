import { loadEnv } from '@hayasedb/config/env'
import { createAuth } from './auth'

const env = loadEnv()

export const auth = createAuth({
  databaseUrl: env.DATABASE_URL,
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_BASE_URL,
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS_LIST,
})
