import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { runMigrations } from './migrate'

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) })

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set')

  await runMigrations(databaseUrl)
  console.log('[db] migrations applied')
}

main().catch((error: unknown) => {
  console.error(`[db] ${error instanceof Error ? error.message : error}`)
  process.exit(1)
})
