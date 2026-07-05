import { defineConfig } from 'drizzle-kit'
import { loadEnv } from '@hayasedb/config/env'

const env = loadEnv()

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: env.DATABASE_URL },
})
