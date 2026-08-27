import { describe, expect, it, vi } from 'vitest'
import { fingerprint } from './key-limit-cache'
import type { KeyLimitCache } from './key-limit-cache'
import { KeyUsageService } from './key-usage.service'
import type { Redis } from '../redis/redis.factory'

const CAP = { max: 60, windowMs: 60_000 }

function make(entries: Record<string, string>, ttl = 30_000, print?: string) {
  const redis = {
    get: vi.fn(async (key: string) => entries[key] ?? null),
    pttl: vi.fn(async () => ttl),
  }
  const limits = {
    fingerprintOf: vi.fn(async () => print),
  }
  return {
    redis,
    limits,
    service: new KeyUsageService(
      redis as unknown as Redis,
      limits as unknown as KeyLimitCache,
    ),
  }
}

const hitKey = (raw: string) => `throttle:hits:default:key:${fingerprint(raw)}`

describe('KeyUsageService', () => {
  it('reads the counter the throttler enforces against', async () => {
    const print = fingerprint('hyd_secret')
    const { service } = make({ [hitKey('hyd_secret')]: '17' }, 30_000, print)

    const usage = await service.forKeyId('key_1', CAP)
    expect(usage.used).toBe(17)
    expect(usage.limit).toBe(60)
    expect(usage.remaining).toBe(43)
    expect(usage.resetsAt).toBeInstanceOf(Date)
  })

  it('reports a clean window for a key that has never been used', async () => {
    const { service } = make({})
    expect(await service.forKeyId('key_cold', CAP)).toEqual({
      used: 0,
      limit: 60,
      remaining: 60,
      windowMs: 60_000,
      resetsAt: null,
    })
  })

  it('reports a clean window when the key is known but the counter expired', async () => {
    const print = fingerprint('hyd_secret')
    const { service } = make({}, -2, print)
    const usage = await service.forKeyId('key_1', CAP)
    expect(usage.used).toBe(0)
    expect(usage.resetsAt).toBeNull()
  })

  it('never reports negative headroom once a key is over its cap', async () => {
    const print = fingerprint('hyd_secret')
    const { service } = make({ [hitKey('hyd_secret')]: '99' }, 5_000, print)
    const usage = await service.forKeyId('key_1', CAP)
    expect(usage.used).toBe(99)
    expect(usage.remaining).toBe(0)
  })

  it('leaves remaining unbounded for an uncapped key', async () => {
    const print = fingerprint('hyd_secret')
    const { service } = make({ [hitKey('hyd_secret')]: '5' }, 5_000, print)
    const usage = await service.forKeyId('key_1', {
      max: null,
      windowMs: 60_000,
    })
    expect(usage.used).toBe(5)
    expect(usage.limit).toBeNull()
    expect(usage.remaining).toBeNull()
  })

  it('omits an expired window rather than inventing a reset time', async () => {
    const print = fingerprint('hyd_secret')
    const { service } = make(
      { [hitKey('hyd_secret')]: 'garbage' },
      5_000,
      print,
    )
    expect((await service.forKeyId('key_1', CAP)).used).toBe(0)
  })
})
