import { randomUUID } from 'node:crypto'
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  MigrationsNotAppliedError,
  assertApplied,
  runMigrations,
} from '../src/migrate'

describe('runMigrations', () => {
  let container: StartedPostgreSqlContainer | undefined
  let url: string

  const withClient = async <T>(
    target: string,
    fn: (client: postgres.Sql) => Promise<T>,
  ): Promise<T> => {
    const client = postgres(target, { max: 1 })
    try {
      return await fn(client)
    } finally {
      await client.end()
    }
  }

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:18').start()
    url = container.getConnectionUri()
  })

  afterAll(async () => {
    await container?.stop()
  })

  it('applies every migration to a fresh database and verifies the journal', async () => {
    await runMigrations(url)

    const client = postgres(url, { max: 1 })
    try {
      await expect(assertApplied(client)).resolves.toBeUndefined()
      const tables = await client<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
      `
      const names = tables.map((t) => t.table_name)
      expect(names).toEqual(
        expect.arrayContaining([
          'user',
          'session',
          'anime',
          'genre',
          'changeset',
        ]),
      )
      const [journal] = await client<{ count: number }[]>`
        SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations
      `
      expect(journal?.count).toBeGreaterThan(0)
    } finally {
      await client.end()
    }
  })

  it('is a no-op on a second run and leaves no lock behind', async () => {
    const client = postgres(url, { max: 1 })
    try {
      const before = await client<{ count: number }[]>`
        SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations
      `
      await runMigrations(url)
      const after = await client<{ count: number }[]>`
        SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations
      `
      expect(after[0]?.count).toBe(before[0]?.count)

      const [lock] = await client<{ locked: boolean }[]>`
        SELECT pg_try_advisory_lock(4711) AS locked
      `
      expect(lock?.locked).toBe(true)
      await client`SELECT pg_advisory_unlock(4711)`
    } finally {
      await client.end()
    }
  })

  it('serializes concurrent runners on the advisory lock', async () => {
    const name = `concurrent_${randomUUID().replaceAll('-', '')}`
    await withClient(url, (admin) => admin.unsafe(`CREATE DATABASE "${name}"`))
    const target = url.replace(/\/[^/]*$/, `/${name}`)

    const results = await Promise.allSettled([
      runMigrations(target),
      runMigrations(target),
      runMigrations(target),
    ])
    expect(results.map((r) => r.status)).toEqual([
      'fulfilled',
      'fulfilled',
      'fulfilled',
    ])

    const client = postgres(target, { max: 1 })
    try {
      await expect(assertApplied(client)).resolves.toBeUndefined()
      const rows = await client<{ hash: string }[]>`
        SELECT hash FROM drizzle.__drizzle_migrations
      `
      expect(new Set(rows.map((r) => r.hash)).size).toBe(rows.length)
    } finally {
      await client.end()
      await withClient(url, (admin) =>
        admin.unsafe(`DROP DATABASE "${name}" WITH (FORCE)`),
      )
    }
  })

  it('reports missing migrations instead of silently passing', async () => {
    await withClient(url, async (client) => {
      const [latest] = await client<
        { id: number; hash: string; created_at: string }[]
      >`
        SELECT id, hash, created_at FROM drizzle.__drizzle_migrations
        ORDER BY id DESC LIMIT 1
      `
      expect(latest).toBeDefined()
      await client`DELETE FROM drizzle.__drizzle_migrations WHERE id = ${latest!.id}`
      try {
        const error = await assertApplied(client).then(
          () => undefined,
          (e: unknown) => e,
        )
        expect(error).toBeInstanceOf(MigrationsNotAppliedError)
        expect((error as MigrationsNotAppliedError).hashes).toHaveLength(1)
      } finally {
        await client`INSERT INTO drizzle.__drizzle_migrations ${client(latest!)}`
      }
      await expect(assertApplied(client)).resolves.toBeUndefined()
    })
  })
})
