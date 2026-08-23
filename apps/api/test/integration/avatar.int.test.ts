import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  createTestHttp,
  errorOf,
  INTERNAL_TOKEN,
  pngFile,
  signUp,
  signUpVerified,
  type TestApp,
  type TestHttp,
  type TestUser,
  textFile,
} from '../harness'

describe('account avatar', () => {
  let app: TestApp
  let user: TestHttp
  let account: TestUser

  beforeAll(async () => {
    app = await createTestApp()
    user = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    account = await signUpVerified(user, app.mailer)
  })

  afterAll(async () => {
    await app.close()
  })

  it('requires a verified account and an image payload', async () => {
    const unverified = createTestHttp(app.baseUrl, {
      internalToken: INTERNAL_TOKEN,
    })
    await signUp(unverified)
    const forbidden = await errorOf(
      unverified.client.account.uploadAvatar({ file: await pngFile(64, 64) }),
    )
    expect(forbidden?.code).toBe('FORBIDDEN')

    const invalid = await errorOf(
      user.client.account.uploadAvatar({ file: textFile() }),
    )
    expect(invalid?.code).toBe('BAD_REQUEST')
  })

  it('uploads, sets the session image and keeps exactly one current avatar across replacements', async () => {
    const first = await user.client.account.uploadAvatar({
      file: await pngFile(256, 256, '#112233'),
    })
    expect(first.image).toBe(first.avatar.url)
    expect((await fetch(first.image)).status).toBe(200)

    const cached = await user.client.auth.getSession({})
    expect(cached?.user.image).toBeNull()
    const fresh = await user.client.auth.getSession({
      disableCookieCache: true,
    })
    expect(fresh?.user.image).toBe(first.image)

    const second = await user.client.account.uploadAvatar({
      file: await pngFile(256, 256, '#445566'),
    })
    expect(second.image).not.toBe(first.image)
    expect(
      (await user.client.auth.getSession({ disableCookieCache: true }))?.user
        .image,
    ).toBe(second.image)

    const rows = await app.db
      .select({
        id: schema.userAvatar.id,
        isCurrent: schema.userAvatar.isCurrent,
      })
      .from(schema.userAvatar)
      .where(eq(schema.userAvatar.userId, account.id))
    expect(rows).toHaveLength(2)
    expect(rows.filter((r) => r.isCurrent).map((r) => r.id)).toEqual([
      second.avatar.id,
    ])

    const back = await user.client.account.uploadAvatar({
      file: await pngFile(256, 256, '#112233'),
    })
    expect(back.avatar.id).toBe(first.avatar.id)
    expect(back.image).toBe(first.image)
    const after = await app.db
      .select({
        id: schema.userAvatar.id,
        isCurrent: schema.userAvatar.isCurrent,
      })
      .from(schema.userAvatar)
      .where(eq(schema.userAvatar.userId, account.id))
    expect(after).toHaveLength(2)
    expect(after.filter((r) => r.isCurrent).map((r) => r.id)).toEqual([
      first.avatar.id,
    ])
  })
})
