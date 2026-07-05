import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const MIGRATIONS_FOLDER = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'drizzle',
)

const ADVISORY_LOCK_ID = 4711

export async function runMigrations(url: string): Promise<void> {
  const client = postgres(url, {
    max: 1,

    onnotice: (notice) => {
      if (notice.code === '42P06' || notice.code === '42P07') return
      console.warn('[db] notice:', notice.message)
    },
  })
  try {
    await client`SELECT pg_advisory_lock(${ADVISORY_LOCK_ID})`
    const db = drizzle(client)
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  } finally {
    await client`SELECT pg_advisory_unlock(${ADVISORY_LOCK_ID})`
    await client.end()
  }
}
