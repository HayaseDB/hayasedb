import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { readMigrationFiles } from 'drizzle-orm/migrator'

const MIGRATIONS_FOLDER = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'drizzle',
)

const ADVISORY_LOCK_ID = 4711
const LOCK_TIMEOUT_MS = 60_000
const LOCK_RETRY_MS = 100
const DDL_LOCK_TIMEOUT_MS = 10_000

export class MigrationLockTimeoutError extends Error {
  override readonly name = 'MigrationLockTimeoutError'

  constructor(timeoutMs: number) {
    super(`Timed out after ${timeoutMs}ms waiting for the migration lock`)
  }
}

export class MigrationsNotAppliedError extends Error {
  override readonly name = 'MigrationsNotAppliedError'

  constructor(readonly hashes: readonly string[]) {
    super(`${hashes.length} migration(s) were not applied`)
  }
}

async function acquireLock(client: postgres.Sql): Promise<void> {
  const deadline = Date.now() + LOCK_TIMEOUT_MS

  for (;;) {
    const [row] = await client<{ locked: boolean }[]>`
      SELECT pg_try_advisory_lock(${ADVISORY_LOCK_ID}) AS locked
    `
    if (row?.locked) return
    if (Date.now() >= deadline) {
      throw new MigrationLockTimeoutError(LOCK_TIMEOUT_MS)
    }
    await delay(LOCK_RETRY_MS)
  }
}

async function releaseLock(client: postgres.Sql): Promise<void> {
  await client`SELECT pg_advisory_unlock(${ADVISORY_LOCK_ID})`
}

async function assertApplied(client: postgres.Sql): Promise<void> {
  const expected = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER })
  const rows = await client<{ hash: string }[]>`
    SELECT hash FROM drizzle.__drizzle_migrations
  `

  const applied = new Set(rows.map(({ hash }) => hash))
  const missing = expected
    .filter(({ hash }) => !applied.has(hash))
    .map(({ hash }) => hash)

  if (missing.length > 0) throw new MigrationsNotAppliedError(missing)
}

export async function runMigrations(url: string): Promise<void> {
  const client = postgres(url, {
    max: 1,
    onnotice: (notice) => {
      if (notice.code === '42P06' || notice.code === '42P07') return
      console.warn('[db] notice:', notice.message)
    },
  })

  let locked = false
  try {
    await client.unsafe(`SET lock_timeout = ${DDL_LOCK_TIMEOUT_MS}`)
    await acquireLock(client)
    locked = true

    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER })
    await assertApplied(client)
  } finally {
    if (locked) await releaseLock(client)
    await client.end()
  }
}
