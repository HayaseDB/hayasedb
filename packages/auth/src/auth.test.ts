import type { Database } from '@hayasedb/db'
import { describe, expect, it, vi } from 'vitest'
import { createAuth, type AuthOptions } from './auth'

const db = {} as Database

function mailer() {
  return {
    sendVerifyEmail: vi.fn(async () => {}),
    sendResetPassword: vi.fn(async () => {}),
    sendChangeEmail: vi.fn(async () => {}),
    sendWelcome: vi.fn(async () => {}),
  }
}

const baseOptions: AuthOptions = {
  db,
  secret: 's'.repeat(32),
  appURL: 'https://hayasedb.test/',
  errorCallbackURL: 'https://hayasedb.test/auth/error',
}

const user = { id: 'u1', email: 'a@b.test', name: 'Sora' }

describe('createAuth', () => {
  it('builds verification links on the frontend origin with an encoded token', async () => {
    const mail = mailer()
    const auth = createAuth({ ...baseOptions, mailer: mail })
    const verification = auth.options.emailVerification!
    await verification.sendVerificationEmail!({
      user,
      url: 'https://api.ignored/x',
      token: 'a+b&c',
    } as never)
    expect(mail.sendVerifyEmail).toHaveBeenCalledWith(
      'a@b.test',
      'https://hayasedb.test/auth/verify-email?token=a%2Bb%26c',
    )
    expect(verification.sendOnSignUp).toBe(true)
    expect(verification.autoSignInAfterVerification).toBe(true)
  })

  it('routes reset, change-email and welcome through the mailer', async () => {
    const mail = mailer()
    const auth = createAuth({ ...baseOptions, mailer: mail })
    await auth.options.emailAndPassword!.sendResetPassword!({
      user,
      url: '',
      token: 't',
    } as never)
    expect(mail.sendResetPassword).toHaveBeenCalledWith(
      'a@b.test',
      'https://hayasedb.test/auth/reset-password?token=t',
    )
    await auth.options.user!.changeEmail!.sendChangeEmailVerification!({
      user,
      newEmail: 'new@b.test',
      url: '',
      token: 't2',
    } as never)
    expect(mail.sendChangeEmail).toHaveBeenCalledWith(
      'new@b.test',
      'https://hayasedb.test/auth/change-email?token=t2',
    )
    await auth.options.emailVerification!.afterEmailVerification!(user as never)
    expect(mail.sendWelcome).toHaveBeenCalledWith(
      'a@b.test',
      'Sora',
      'https://hayasedb.test',
    )
  })

  it('disables every mail-driven flow when no mailer is configured', () => {
    const auth = createAuth(baseOptions)
    expect(auth.options.emailVerification).toBeUndefined()
    expect(auth.options.emailAndPassword!.sendResetPassword).toBeUndefined()
    expect(
      auth.options.user!.changeEmail!.sendChangeEmailVerification,
    ).toBeUndefined()
    expect(auth.options.emailAndPassword!.requireEmailVerification).toBe(false)
  })

  it('calls the delete hook with only id and email', async () => {
    const onDeleteUser = vi.fn()
    const auth = createAuth({ ...baseOptions, onDeleteUser })
    await auth.options.user!.deleteUser!.beforeDelete!({
      ...user,
      role: 'admin',
    } as never)
    expect(onDeleteUser).toHaveBeenCalledWith({ id: 'u1', email: 'a@b.test' })
  })

  it('only treats requests as api-key authenticated on get-session', () => {
    const auth = createAuth(baseOptions)
    const plugin = auth.options.plugins!.find((p) => p.id === 'api-key')!
    const matcher = (
      plugin as unknown as {
        hooks: { before: Array<{ matcher: (ctx: unknown) => boolean }> }
      }
    ).hooks.before[0]!.matcher
    const headers = new Headers({ 'x-api-key': 'hyd_abc' })
    expect(matcher({ path: '/get-session', headers })).toBe(true)
    expect(matcher({ path: '/sign-in/email', headers })).toBe(false)
    expect(matcher({ path: '/get-session', headers: new Headers() })).toBe(
      false,
    )
  })
})
