import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  ADMIN_ORIGIN,
  createTestApp,
  createTestHttp,
  errorOf,
  internal,
  INTERNAL_TOKEN,
  signIn,
  signUpVerified,
  type TestApp,
  WEB_ORIGIN,
} from '../harness'

describe('session cookies and API keys', () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('sets an HttpOnly session cookie on sign-in and clears it on sign-out', async () => {
    const http = internal(app)
    const user = await signUpVerified(http, app.mailer)
    await http.client.auth.signOut()
    expect(await http.client.auth.getSession({})).toBeNull()

    const response = await http.fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
    })
    expect(response.status).toBe(200)
    const cookies = response.headers.getSetCookie()
    const session = cookies.find((c) => c.includes('session_token='))
    expect(session).toMatch(/HttpOnly/i)
    expect(session).toMatch(/SameSite=Lax/i)
    expect(session).not.toMatch(/Secure/i)
    expect(session).not.toMatch(/Domain=/i)

    const signOut = await http.fetch('/api/auth/sign-out', { method: 'POST' })
    expect(signOut.status).toBe(200)
    expect(
      signOut.headers
        .getSetCookie()
        .some((c) => c.includes('session_token=') && /Max-Age=0/i.test(c)),
    ).toBe(true)
    expect(await http.client.auth.getSession({})).toBeNull()
  })

  it('lists sessions and lets the user revoke one of them', async () => {
    const first = internal(app)
    const user = await signUpVerified(first, app.mailer)
    const second = internal(app)
    await signIn(second, user)

    const current = await first.client.auth.getSession({})
    const sessions = await first.client.auth.listSessions()
    expect(sessions).toHaveLength(2)
    const other = sessions.find((s) => s.token !== current?.session.token)
    expect(other).toBeDefined()

    await first.client.auth.revokeSession({ token: other!.token })
    expect(
      await second.client.auth.getSession({ disableCookieCache: true }),
    ).toBeNull()
    expect(await first.client.auth.getSession({})).not.toBeNull()
  })

  it('allows CORS only for trusted origins', async () => {
    const http = internal(app)
    const allowed = await http.fetch('/api/health', {
      headers: { origin: WEB_ORIGIN },
    })
    expect(allowed.headers.get('access-control-allow-origin')).toBe(WEB_ORIGIN)
    expect(allowed.headers.get('access-control-allow-credentials')).toBe('true')
    const admin = await http.fetch('/api/health', {
      headers: { origin: ADMIN_ORIGIN },
    })
    expect(admin.headers.get('access-control-allow-origin')).toBe(ADMIN_ORIGIN)
    const evil = await http.fetch('/api/health', {
      headers: { origin: 'https://evil.test' },
    })
    expect(evil.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('shows the API key secret once, lists without it and scopes keys per user', async () => {
    const alice = internal(app)
    await signUpVerified(alice, app.mailer)
    const created = await alice.client.auth.apiKey.create({ name: 'alice-key' })
    expect(created.key).toMatch(/^hyd_/)

    const listed = await alice.client.auth.apiKey.list()
    expect(listed.items.map((k) => k.id)).toContain(created.id)
    expect(listed.meta.total).toBe(listed.items.length)
    expect(JSON.stringify(listed)).not.toContain(created.key)

    const bob = internal(app)
    await signUpVerified(bob, app.mailer)
    expect(await bob.client.auth.apiKey.list()).toEqual({
      items: [],
      meta: { total: 0 },
    })
    const steal = await errorOf(
      bob.client.auth.apiKey.delete({ id: created.id }),
    )
    expect(steal?.code).toBe('NOT_FOUND')
    expect(
      (await alice.client.auth.apiKey.list()).items.map((k) => k.id),
    ).toContain(created.id)
  })

  it('resolves an API key to its owner only on the session route', async () => {
    const owner = internal(app)
    const user = await signUpVerified(owner, app.mailer)
    const { key } = await owner.client.auth.apiKey.create({ name: 'k' })

    const keyed = createTestHttp(app.baseUrl, {
      apiKey: key,
      internalToken: INTERNAL_TOKEN,
    })
    const session = await keyed.client.auth.getSession({})
    expect(session?.user.id).toBe(user.id)

    const keyedOnly = createTestHttp(app.baseUrl, { apiKey: key })
    const list = await keyedOnly.fetch('/api/auth/api-keys')
    expect(list.status).toBe(403)
  })
})
