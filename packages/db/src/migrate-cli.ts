import { loadEnv } from '@hayasedb/config/env'
import { runMigrations } from './migrate'

async function main() {
  const env = loadEnv()
  console.log('[db] applying migrations…')
  await runMigrations(env.DATABASE_URL)
  console.log('[db] migrations up to date.')
}

main().catch((err) => {
  console.error('[db] migration failed:', err)
  process.exit(1)
})
