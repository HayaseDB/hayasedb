import { fileURLToPath } from 'node:url'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import type postgres from 'postgres'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MigrationConnectTimeoutError,
  MigrationsNotAppliedError,
  assertApplied,
  isTransientConnectError,
  waitForConnection,
} from './migrate'

function fakeClient(query: () => Promise<unknown>): postgres.Sql {
  return (() => query()) as unknown as postgres.Sql
}

describe('isTransientConnectError', () => {
  it.each([
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ECONNRESET',
    'ETIMEDOUT',
    'CONNECT_TIMEOUT',
    '57P03',
  ])('treats %s as transient', (code) => {
    expect(isTransientConnectError({ code })).toBe(true)
  })

  it('treats auth failures, bad codes and non-errors as fatal', () => {
    expect(isTransientConnectError({ code: '28P01' })).toBe(false)
    expect(isTransientConnectError({ code: 57 })).toBe(false)
    expect(isTransientConnectError(new Error('x'))).toBe(false)
    expect(isTransientConnectError(null)).toBe(false)
  })
})

describe('waitForConnection', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('retries transient failures until the database answers', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    let attempts = 0
    const client = fakeClient(async () => {
      attempts += 1
      if (attempts < 3)
        throw Object.assign(new Error('refused'), { code: 'ECONNREFUSED' })
      return [{ '?column?': 1 }]
    })
    const pending = waitForConnection(client)
    await vi.advanceTimersByTimeAsync(2_500)
    await expect(pending).resolves.toBeUndefined()
    expect(attempts).toBe(3)
  })

  it('rethrows non-transient errors immediately', async () => {
    const client = fakeClient(async () => {
      throw Object.assign(new Error('bad password'), { code: '28P01' })
    })
    await expect(waitForConnection(client)).rejects.toThrow('bad password')
  })

  it('gives up after the connect timeout', async () => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const client = fakeClient(async () => {
      throw Object.assign(new Error('refused'), { code: 'ECONNREFUSED' })
    })
    const pending = waitForConnection(client)
    const failure = pending.catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(95_000)
    expect(await failure).toBeInstanceOf(MigrationConnectTimeoutError)
  })
})

describe('assertApplied', () => {
  const expected = readMigrationFiles({
    migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
  })

  it('passes when every migration hash on disk is recorded', async () => {
    const client = fakeClient(async () =>
      expected.map(({ hash }) => ({ hash })),
    )
    await expect(assertApplied(client)).resolves.toBeUndefined()
  })

  it('lists exactly the missing hashes', async () => {
    const applied = expected.slice(0, -2).map(({ hash }) => ({ hash }))
    const client = fakeClient(async () => applied)
    const error = await assertApplied(client).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(MigrationsNotAppliedError)
    expect((error as MigrationsNotAppliedError).hashes).toEqual(
      expected.slice(-2).map(({ hash }) => hash),
    )
  })
})
