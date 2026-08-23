import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  createTestHttp,
  INTERNAL_TOKEN,
  signUpVerified,
  type TestApp,
} from '../harness'

describe('API access boundary', () => {
  let app: TestApp
  let apiKey: string
  let revokedKey: string

  beforeAll(async () => {
    app = await createTestApp()
    const owner = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpVerified(owner, app.mailer)
    const created = await owner.client.auth.apiKey.create({ name: 'ci' })
    apiKey = created.key
    const revoked = await owner.client.auth.apiKey.create({ name: 'old' })
    revokedKey = revoked.key
    await owner.client.auth.apiKey.delete({ id: revoked.id })
  })

  afterAll(async () => {
    await app.close()
  })

  it('rejects requests with neither an internal token nor an API key', async () => {
    const http = createTestHttp(app.baseUrl)
    const response = await http.fetch('/api/anime')
    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'An API key is required to access this endpoint.',
    })
  })

  it('rejects a wrong internal token', async () => {
    const http = createTestHttp(app.baseUrl, {
      internalToken: 'x'.repeat(INTERNAL_TOKEN.length),
    })
    expect((await http.fetch('/api/anime')).status).toBe(401)
  })

  it('serves allowlisted routes to a valid API key', async () => {
    const http = createTestHttp(app.baseUrl, { apiKey })
    const list = await http.client.anime.list({})
    expect(list.meta.total).toBe(0)
    expect(await http.client.system.ping({})).toMatchObject({ ok: true })
    expect((await http.fetch('/api/genres')).status).toBe(200)
  })

  it('refuses an API key on routes outside the allowlist', async () => {
    const http = createTestHttp(app.baseUrl, { apiKey })
    const response = await http.fetch('/api/auth/api-keys')
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ code: 'FORBIDDEN' })
  })

  it('rejects revoked, unknown and malformed keys with 401', async () => {
    const revoked = await createTestHttp(app.baseUrl, {
      apiKey: revokedKey,
    }).fetch('/api/anime')
    expect(revoked.status).toBe(401)
    expect(await revoked.json()).toMatchObject({ message: 'Invalid API key.' })

    const unknown = await createTestHttp(app.baseUrl, {
      apiKey: 'hyd_not_a_real_key',
    }).fetch('/api/anime')
    expect(unknown.status).toBe(401)
    expect(await unknown.json()).toMatchObject({ message: 'Invalid API key.' })

    const malformed = await createTestHttp(app.baseUrl, {
      apiKey: 'hyd_' + 'x'.repeat(64),
    }).fetch('/api/anime')
    expect(malformed.status).toBe(401)
  })

  it('lets internal callers reach everything and keeps open routes public', async () => {
    const internal = createTestHttp(app.baseUrl, {
      internalToken: INTERNAL_TOKEN,
    })
    expect((await internal.fetch('/api/auth/session')).status).toBe(200)
    const anonymous = createTestHttp(app.baseUrl)
    expect((await anonymous.fetch('/api/health')).status).toBe(200)
  })
})
