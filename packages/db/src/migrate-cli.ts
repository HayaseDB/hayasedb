import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { runMigrations } from './migrate'

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) })

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  console.log('[db] applying migrations…')
  await runMigrations(databaseUrl)
  console.log('[db] migrations up to date.')
}

main().catch((err) => {
  console.error('[db] migration failed:', err)
  process.exit(1)
})
