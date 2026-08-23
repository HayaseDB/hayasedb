import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  errorOf,
  internal,
  signIn,
  signUpVerified,
  type TestApp,
  uniqueEmail,
} from '../harness'

describe('password reset', () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('answers the same for unknown emails and sends nothing', async () => {
    const email = uniqueEmail('ghost')
    const result = await internal(app).client.auth.requestPasswordReset({
      email,
    })
    expect(result.success).toBe(true)
    expect(app.mailer.countFor(email, 'reset')).toBe(0)
  })

  it('resets with the mailed token, invalidating the old password and the token itself', async () => {
    const http = internal(app)
    const user = await signUpVerified(http, app.mailer)
    await http.client.auth.signOut()

    await http.client.auth.requestPasswordReset({ email: user.email })
    const token = app.mailer.tokenFrom(app.mailer.lastFor(user.email, 'reset'))
    const newPassword = 'a-brand-new-password-123'

    await internal(app).client.auth.resetPassword({ token, newPassword })

    const old = await errorOf(signIn(internal(app), user))
    expect(old?.code).toBe('UNAUTHORIZED')

    const fresh = internal(app)
    const signedIn = await signIn(fresh, {
      email: user.email,
      password: newPassword,
    })
    expect(signedIn.user.id).toBe(user.id)

    const reused = await errorOf(
      internal(app).client.auth.resetPassword({
        token,
        newPassword: 'another-one-456789',
      }),
    )
    expect(reused?.code).toBe('BAD_REQUEST')
  })
})
