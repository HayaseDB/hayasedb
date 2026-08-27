import type { ExecutionContext } from '@nestjs/common'
import { Throttle, type ThrottlerStorage } from '@nestjs/throttler'
import { API_KEY_HEADER } from '@hayasedb/contract'
import { describe, expect, it } from 'vitest'
import { RouteThrottle, throttlerOptions } from './throttler'

type KeyGenerator = (
  context: ExecutionContext,
  tracker: string,
  name: string,
) => string

function httpContext(
  headers: Record<string, string>,
  ip = '203.0.113.9',
): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ headers, ip }) }),
  } as unknown as ExecutionContext
}

function single(keyLimits?: Parameters<typeof throttlerOptions>[1]) {
  const options = throttlerOptions({} as ThrottlerStorage, keyLimits) as {
    throttlers: unknown[]
  }
  const [throttler] = options.throttlers as Array<{
    ttl: number
    limit: (context: ExecutionContext) => number | Promise<number>
    skipIf: (context: ExecutionContext) => boolean
    getTracker: (
      request: unknown,
      context: ExecutionContext,
    ) => string | Promise<string>
    generateKey: (
      context: ExecutionContext,
      tracker: string,
      name: string,
    ) => string
  }>
  return throttler!
}

describe('throttlerOptions', () => {
  it('limits API keys to 60 per minute and IPs to 600', async () => {
    const t = single()
    expect(t.ttl).toBe(60_000)
    expect(await t.limit(httpContext({ [API_KEY_HEADER]: 'hyd_x' }))).toBe(60)
    expect(await t.limit(httpContext({}))).toBe(600)
  })

  it("applies a key's own limit once it has been cached", async () => {
    const cache = { get: async () => ({ max: 500, windowMs: 60_000 }) }
    const t = single(cache as never)
    expect(await t.limit(httpContext({ [API_KEY_HEADER]: 'hyd_x' }))).toBe(500)
    expect(await t.limit(httpContext({}))).toBe(600)
  })

  it('normalises a limit configured over a different window', async () => {
    const cache = { get: async () => ({ max: 1000, windowMs: 3_600_000 }) }
    const t = single(cache as never)
    expect(await t.limit(httpContext({ [API_KEY_HEADER]: 'hyd_x' }))).toBe(17)
  })

  it('falls back to the default while the cache is cold', async () => {
    const cache = { get: async () => undefined }
    const t = single(cache as never)
    expect(await t.limit(httpContext({ [API_KEY_HEADER]: 'hyd_x' }))).toBe(60)
  })

  it('applies the default ceiling to a key with none configured', async () => {
    const cache = { get: async () => ({ max: null, windowMs: 60_000 }) }
    const t = single(cache as never)
    expect(await t.limit(httpContext({ [API_KEY_HEADER]: 'hyd_x' }))).toBe(60)
  })

  it('tracks keyed requests by a key fingerprint, never the raw key', async () => {
    const t = single()
    const tracker = await t.getTracker(
      undefined,
      httpContext({ [API_KEY_HEADER]: 'hyd_secret' }),
    )
    expect(tracker).toMatch(/^key:[0-9a-f]{32}$/)
    expect(tracker).not.toContain('hyd_secret')
    expect(
      await t.getTracker(
        undefined,
        httpContext({ [API_KEY_HEADER]: 'hyd_secret' }),
      ),
    ).toBe(tracker)
  })

  it('tracks anonymous requests by IP', async () => {
    const t = single()
    expect(await t.getTracker(undefined, httpContext({}, '10.1.2.3'))).toBe(
      'ip:10.1.2.3',
    )
  })

  it('uses the tracker as the storage key and skips non-http contexts', () => {
    const t = single()
    const context = httpContext({})
    expect(t.generateKey(context, 'ip:1.1.1.1', 'default')).toBe('ip:1.1.1.1')
    expect(t.skipIf(context)).toBe(false)
    expect(t.skipIf({ getType: () => 'rpc' } as never)).toBe(true)
  })
})

describe('RouteThrottle', () => {
  it('namespaces the key by class and handler so route limits stay separate', () => {
    class AuthController {
      @RouteThrottle(30)
      signIn() {}
    }
    class Reference {
      @Throttle({ default: { limit: 30, ttl: 60_000 } })
      signIn() {}
    }
    const handler = AuthController.prototype.signIn
    const reference = Reference.prototype.signIn
    const referenceKeys = Reflect.getMetadataKeys(reference)
    expect(referenceKeys.length).toBeGreaterThan(0)
    for (const key of referenceKeys) {
      const expected = Reflect.getMetadata(key, reference) as unknown
      if (expected !== undefined) {
        expect(Reflect.getMetadata(key, handler)).toEqual(expected)
      }
    }
    const generateKey = Reflect.getMetadataKeys(handler)
      .map((key) => Reflect.getMetadata(key, handler) as unknown)
      .find((value): value is KeyGenerator => typeof value === 'function')!
    const context = {
      getClass: () => AuthController,
      getHandler: () => handler,
    } as unknown as ExecutionContext
    expect(generateKey(context, 'ip:1.1.1.1', 'default')).toBe(
      'AuthController:signIn:ip:1.1.1.1',
    )
  })
})
