import type { ExecutionContext } from '@nestjs/common'
import type { ThrottlerRequest, ThrottlerStorage } from '@nestjs/throttler'
import { Reflector } from '@nestjs/core'
import { describe, expect, it } from 'vitest'
import { RateLimitGuard } from './rate-limit.guard'

type ThrottlerStorageRecord = Awaited<ReturnType<ThrottlerStorage['increment']>>

function fakeResponse() {
  const headers: Record<string, string> = {}
  return {
    headers,
    headersSent: false,
    getHeader: (name: string) => headers[name],
    setHeader: (name: string, value: string) => {
      headers[name] = value
    },
    header: (name: string, value: unknown) => {
      headers[name] = String(value)
    },
  }
}

async function run(record: ThrottlerStorageRecord, name = 'default') {
  const res = fakeResponse()
  const storage: ThrottlerStorage = { increment: async () => record }

  class TestGuard extends RateLimitGuard {
    protected override getRequestResponse() {
      return { req: { headers: {} }, res } as never
    }
    async run(props: ThrottlerRequest) {
      return this.handleRequest(props)
    }
  }

  const guard = new TestGuard(
    { throttlers: [] },
    storage,
    new Reflector() as Reflector,
  )
  await guard.onModuleInit()
  const props = {
    context: {} as ExecutionContext,
    limit: 60,
    ttl: 60_000,
    blockDuration: 60_000,
    throttler: { name, ttl: 60_000, limit: 60 },
    getTracker: () => 'key:abc',
    generateKey: () => 'key:abc',
  } as unknown as ThrottlerRequest

  return { res, result: guard.run(props) }
}

describe('RateLimitGuard', () => {
  it('mirrors the X-RateLimit family into IETF headers', async () => {
    const { res, result } = await run({
      totalHits: 3,
      timeToExpire: 42,
      isBlocked: false,
      timeToBlockExpire: 0,
    })
    await expect(result).resolves.toBe(true)

    expect(res.headers['X-RateLimit-Remaining']).toBe('57')
    expect(res.headers['RateLimit-Limit']).toBe('60')
    expect(res.headers['RateLimit-Remaining']).toBe('57')
    expect(res.headers['RateLimit-Reset']).toBe('42')
    expect(res.headers['RateLimit-Policy']).toBe('60;w=60')
  })

  it('still writes the headers when the request is blocked', async () => {
    const { res, result } = await run({
      totalHits: 61,
      timeToExpire: 30,
      isBlocked: true,
      timeToBlockExpire: 30,
    })
    await expect(result).rejects.toThrow()

    expect(res.headers['RateLimit-Limit']).toBe('60')
    expect(res.headers['Retry-After']).toBe('30')
    expect(res.headers['RateLimit-Reset']).toBe('30')
  })

  it('leaves named throttlers alone so route limits stay private', async () => {
    const { res, result } = await run(
      {
        totalHits: 1,
        timeToExpire: 42,
        isBlocked: false,
        timeToBlockExpire: 0,
      },
      'signin',
    )
    await result

    expect(res.headers['X-RateLimit-Limit-signin']).toBe('60')
    expect(res.headers['RateLimit-Limit']).toBeUndefined()
  })
})
