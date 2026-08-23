import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  createTestHttp,
  INTERNAL_TOKEN,
  type TestApp,
  uniqueEmail,
} from '../harness'

describe('guard order and throttling', () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('answers 401 before counting against the rate limit', async () => {
    const http = createTestHttp(app.baseUrl, { forwardedFor: '10.250.0.6' })
    for (let i = 0; i < 5; i += 1) {
      expect((await http.fetch('/api/anime')).status).toBe(401)
    }
    expect(await app.redis.keys('*ip:10.250.0.6*')).toEqual([])
  })

  it('limits sign-in attempts per IP to 30 per minute with Retry-After', async () => {
    const http = createTestHttp(app.baseUrl, {
      internalToken: INTERNAL_TOKEN,
      forwardedFor: '10.250.0.7',
    })
    const body = JSON.stringify({
      email: uniqueEmail(),
      password: 'wrong-password-123',
    })
    const post = () =>
      http.fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      })

    let last: Response | undefined
    for (let i = 0; i < 30; i += 1) {
      last = await post()
      expect(last.status).toBe(401)
    }
    expect(last?.headers.get('x-ratelimit-remaining')).toBe('0')

    const limited = await post()
    expect(limited.status).toBe(429)
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(await limited.json()).toMatchObject({ code: 'TOO_MANY_REQUESTS' })

    const otherIp = createTestHttp(app.baseUrl, {
      internalToken: INTERNAL_TOKEN,
      forwardedFor: '10.250.0.8',
    })
    const fresh = await otherIp.fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    })
    expect(fresh.status).toBe(401)
  })

  it('keeps the sign-in limit separate from the global per-IP budget', async () => {
    const http = createTestHttp(app.baseUrl, {
      internalToken: INTERNAL_TOKEN,
      forwardedFor: '10.250.0.9',
    })
    for (let i = 0; i < 31; i += 1) {
      await http.fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: uniqueEmail(),
          password: 'wrong-password-123',
        }),
      })
    }
    expect((await http.fetch('/api/ping')).status).toBe(200)
  })
})
