import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  errorOf,
  internal,
  PASSWORD,
  signUp,
  type TestApp,
  uniqueEmail,
} from '../harness'

describe('sign-up and email verification', () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('signs the user in immediately, sends the verification mail once and gates verified-only routes', async () => {
    const http = internal(app)
    const user = await signUp(http)

    expect(http.jar.cookies.size).toBeGreaterThan(0)
    const session = await http.client.auth.getSession({})
    expect(session?.user).toMatchObject({
      email: user.email,
      emailVerified: false,
    })
    expect(app.mailer.countFor(user.email, 'verify')).toBe(1)

    const blocked = await errorOf(http.client.auth.apiKey.create({ name: 'x' }))
    expect(blocked?.code).toBe('FORBIDDEN')
    expect(blocked?.message).toBe('Email address is not verified')
  })

  it('verifies with the mailed token and sends the welcome mail exactly once', async () => {
    const http = internal(app)
    const user = await signUp(http)
    const token = app.mailer.tokenFrom(app.mailer.lastFor(user.email, 'verify'))

    const fresh = internal(app)
    await fresh.client.auth.verifyEmail({ token })
    const session = await fresh.client.auth.getSession({
      disableCookieCache: true,
    })
    expect(session?.user.emailVerified).toBe(true)
    expect(app.mailer.countFor(user.email, 'welcome')).toBe(1)

    await internal(app).client.auth.verifyEmail({ token })
    expect(app.mailer.countFor(user.email, 'welcome')).toBe(1)
  })

  it('rejects a garbage verification token', async () => {
    const error = await errorOf(
      internal(app).client.auth.verifyEmail({ token: 'nope' }),
    )
    expect(error?.code).toBe('BAD_REQUEST')
    expect(error?.message).toBe('Invalid token')
  })

  it('turns a duplicate email into CONFLICT', async () => {
    const email = uniqueEmail('dup')
    await signUp(internal(app), { email })
    const error = await errorOf(
      internal(app).client.auth.signUpEmail({
        email,
        name: 'Twin',
        password: PASSWORD,
      }),
    )
    expect(error?.code).toBe('CONFLICT')
  })

  it('validates the payload before reaching Better Auth', async () => {
    const error = await errorOf(
      internal(app).client.auth.signUpEmail({
        email: 'not-an-email',
        name: '',
        password: 'short',
      }),
    )
    expect(error?.code).toBe('BAD_REQUEST')
    expect(error?.message).toBe('Input validation failed')
  })

  it('resends the verification mail on request', async () => {
    const http = internal(app)
    const user = await signUp(http)
    await http.client.auth.sendVerificationEmail({ email: user.email })
    expect(app.mailer.countFor(user.email, 'verify')).toBe(2)
  })
})
