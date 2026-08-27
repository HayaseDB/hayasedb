import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { tables } from '@hayasedb/db'
import { eq } from 'drizzle-orm'
import {
  createTestApp,
  createTestHttp,
  INTERNAL_TOKEN,
  signUpVerified,
  type TestApp,
} from '../harness'

describe('rate limit headers', () => {
  let app: TestApp
  let apiKey: string
  let generousKey: string

  beforeAll(async () => {
    app = await createTestApp()
    const owner = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpVerified(owner, app.mailer)

    apiKey = (await owner.client.auth.apiKey.create({ name: 'default' })).key

    const generous = await owner.client.auth.apiKey.create({ name: 'generous' })
    generousKey = generous.key
    await app.db
      .update(tables.apikey)
      .set({ rateLimitMax: 500, rateLimitTimeWindow: 60_000 })
      .where(eq(tables.apikey.id, generous.id))
  })

  afterAll(async () => {
    await app.close()
  })

  it('emits the IETF and legacy header families on a keyed request', async () => {
    const http = createTestHttp(app.baseUrl, { apiKey })
    const response = await http.fetch('/api/anime')
    expect(response.status).toBe(200)

    expect(response.headers.get('ratelimit-limit')).toBe('60')
    expect(Number(response.headers.get('ratelimit-remaining'))).toBeLessThan(60)
    expect(Number(response.headers.get('ratelimit-reset'))).toBeGreaterThan(0)
    expect(response.headers.get('ratelimit-policy')).toBe('60;w=60')

    expect(response.headers.get('x-ratelimit-limit')).toBe('60')
  })

  it("applies a key's own configured limit once the cache is warm", async () => {
    const http = createTestHttp(app.baseUrl, { apiKey: generousKey })

    const cold = await http.fetch('/api/anime')
    expect(cold.headers.get('ratelimit-limit')).toBe('60')

    let warm = cold
    for (let i = 0; i < 20; i += 1) {
      warm = await http.fetch('/api/anime')
      if (warm.headers.get('ratelimit-limit') === '500') break
    }
    expect(warm.headers.get('ratelimit-limit')).toBe('500')
    expect(warm.headers.get('ratelimit-policy')).toBe('500;w=60')

    const other = createTestHttp(app.baseUrl, { apiKey })
    const response = await other.fetch('/api/anime')
    expect(response.headers.get('ratelimit-limit')).toBe('60')
  })
})
