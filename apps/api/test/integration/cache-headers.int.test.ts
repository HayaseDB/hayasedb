import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  createTestHttp,
  INTERNAL_TOKEN,
  signUpAdmin,
  type TestApp,
  type TestHttp,
} from '../harness'

describe('http caching', () => {
  let app: TestApp
  let admin: TestHttp

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    await admin.client.anime.create({ slug: 'cache-anime' })
  })

  afterAll(async () => {
    await app.close()
  })

  it('sends Cache-Control, Vary and an ETag on a cacheable read', async () => {
    const response = await admin.fetch('/api/anime')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=10, stale-while-revalidate=30',
    )
    expect(response.headers.get('vary')).toBe('Accept-Encoding, X-Api-Key')
    expect(response.headers.get('etag')).toMatch(/^"[\w-]+"$/)
  })

  it('answers a matching If-None-Match with a bodyless 304', async () => {
    const first = await admin.fetch('/api/anime')
    const etag = first.headers.get('etag')!
    const second = await admin.fetch('/api/anime', {
      headers: { 'if-none-match': etag },
    })
    expect(second.status).toBe(304)
    expect(await second.text()).toBe('')
  })
})
