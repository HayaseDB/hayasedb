import 'dotenv/config'
import { createAuth } from '@hayasedb/auth'
import { validate } from '../config/env.schema'

const env = validate(process.env)

export const auth = createAuth({
  databaseUrl: env.DATABASE_URL,
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_BASE_URL,
  trustedOrigins: env.AUTH_TRUSTED_ORIGINS,
})
