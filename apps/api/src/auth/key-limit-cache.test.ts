import { describe, expect, it, vi } from 'vitest'
import { KeyLimitCache, fingerprint, hashApiKey } from './key-limit-cache'
import type { Redis } from '../redis/redis.factory'
import type { Database } from '@hayasedb/db'

function fakeRedis() {
  const store = new Map<string, string>()
  return {
    store,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
      return 'OK'
    }),
    del: vi.fn(async (...keys: string[]) =>
      keys.reduce((n, key) => n + (store.delete(key) ? 1 : 0), 0),
    ),
    pttl: vi.fn(async () => -2),
  }
}

function fakeDb(row: Record<string, unknown> | undefined) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => (row ? [row] : []) }),
      }),
    }),
  }
}

const make = (redis: ReturnType<typeof fakeRedis>, db: unknown) =>
  new KeyLimitCache(redis as unknown as Redis, db as Database)

describe('hashApiKey', () => {
  it("matches better-auth's storage hash byte for byte", () => {
    expect(hashApiKey('hyd_abc123')).toBe(
      'Fm2H3uj80aopF5m3yAUr5kruMq9tAAzKL-ZrR7jlH6w',
    )
    expect(hashApiKey(`hyd_${'x'.repeat(40)}`)).toBe(
      '79QKC6yM0K2z-kXHH9irv7z2bDysS7WmnWWIGAcGiqw',
    )
    expect(hashApiKey('')).toBe('47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU')
  })
})

describe('KeyLimitCache', () => {
  it('stores the fingerprint, never the raw key', async () => {
    const redis = fakeRedis()
    await make(redis, fakeDb(undefined)).set('hyd_secret', {
      max: 60,
      windowMs: 60_000,
    })

    const [storedKey] = [...redis.store.keys()]
    expect(storedKey).toContain(fingerprint('hyd_secret'))
    expect(storedKey).not.toContain('hyd_secret')
  })

  it('round-trips a cached limit', async () => {
    const redis = fakeRedis()
    const cache = make(redis, fakeDb(undefined))
    await cache.set('hyd_secret', { max: 500, windowMs: 60_000 })
    expect(await cache.get('hyd_secret')).toEqual({
      max: 500,
      windowMs: 60_000,
    })
  })

  it('returns undefined for a cold key and for corrupt json', async () => {
    const redis = fakeRedis()
    const cache = make(redis, fakeDb(undefined))
    expect(await cache.get('hyd_cold')).toBeUndefined()

    redis.store.set(`apikey:limit:${fingerprint('hyd_bad')}`, 'not json')
    expect(await cache.get('hyd_bad')).toBeUndefined()
  })

  it('refreshes from the apikey row', async () => {
    const redis = fakeRedis()
    const cache = make(redis, fakeDb({ max: 500, windowMs: 60_000 }))
    await cache.refresh('hyd_secret')
    expect(await cache.get('hyd_secret')).toEqual({
      max: 500,
      windowMs: 60_000,
    })
  })

  it('treats a row with no configured cap as uncapped', async () => {
    const redis = fakeRedis()
    const cache = make(redis, fakeDb({ max: null, windowMs: null }))
    await cache.refresh('hyd_secret')
    expect(await cache.get('hyd_secret')).toEqual({
      max: null,
      windowMs: 60_000,
    })
  })

  it('never throws when the database is unreachable', async () => {
    const redis = fakeRedis()
    const db = {
      select: () => {
        throw new Error('connection refused')
      },
    }
    await expect(make(redis, db).refresh('hyd_secret')).resolves.toBeUndefined()
  })

  it('records the reverse index on refresh so usage is reachable by id', async () => {
    const redis = fakeRedis()
    const cache = make(
      redis,
      fakeDb({ id: 'key_1', max: 60, windowMs: 60_000 }),
    )
    await cache.refresh('hyd_secret')
    expect(await cache.fingerprintOf('key_1')).toBe(fingerprint('hyd_secret'))
  })

  it('invalidates a revoked key by id, clearing both entries', async () => {
    const redis = fakeRedis()
    const cache = make(
      redis,
      fakeDb({ id: 'key_1', max: 500, windowMs: 60_000 }),
    )
    await cache.refresh('hyd_secret')
    expect(await cache.get('hyd_secret')).toBeDefined()

    await cache.invalidateById('key_1')
    expect(await cache.get('hyd_secret')).toBeUndefined()
    expect(await cache.fingerprintOf('key_1')).toBeUndefined()
  })

  it('still clears the reverse index when the key was never used', async () => {
    const redis = fakeRedis()
    const cache = make(redis, fakeDb(undefined))
    await expect(cache.invalidateById('key_unused')).resolves.toBeUndefined()
  })
})
