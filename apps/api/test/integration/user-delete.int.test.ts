import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  createTestHttp,
  errorOf,
  INTERNAL_TOKEN,
  pngFile,
  signIn,
  signUpVerified,
  type TestApp,
  type TestHttp,
  type TestUser,
} from '../harness'

describe('account deletion', () => {
  let app: TestApp
  let user: TestHttp
  let other: TestHttp
  let account: TestUser
  let apiKey: string
  let avatarUrl: string
  let uploadMediaId: string
  let changesetId: string

  beforeAll(async () => {
    app = await createTestApp()
    user = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    account = await signUpVerified(user, app.mailer)
    other = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signIn(other, account)

    apiKey = (await user.client.auth.apiKey.create({ name: 'doomed' })).key
    avatarUrl = (
      await user.client.account.uploadAvatar({
        file: await pngFile(64, 64, '#abcdef'),
      })
    ).image
    uploadMediaId = (
      await user.client.media.upload({
        file: await pngFile(50, 50, '#fedcba'),
      })
    ).mediaId
    changesetId = (
      await user.client.changeset.submit({
        summary: 'from a user who will leave',
        changes: [
          {
            op: 'create',
            entityKind: 'anime',
            entityId: crypto.randomUUID(),
            payload: {
              slug: 'orphaned-contribution',
              titleEnglish: 'Orphan',
              genreIds: [],
              media: [],
            },
          },
        ],
      })
    ).id

    const result = await user.client.auth.deleteUser({})
    expect(result.success).toBe(true)
  })

  afterAll(async () => {
    await app.close()
  })

  it('removes the user row', async () => {
    expect(
      await app.db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, account.id)),
    ).toHaveLength(0)
  })

  it('invalidates every session, including other devices', async () => {
    const me = await errorOf(user.client.auth.listSessions())
    expect(me?.code).toBe('UNAUTHORIZED')
    expect(await other.client.auth.listSessions()).toEqual([])
    expect(
      await other.client.auth.getSession({ disableCookieCache: true }),
    ).toBeNull()
    expect(
      await app.db
        .select()
        .from(schema.session)
        .where(eq(schema.session.userId, account.id)),
    ).toHaveLength(0)
  })

  it('revokes api keys', async () => {
    const byKey = createTestHttp(app.baseUrl, {
      internalToken: INTERNAL_TOKEN,
      apiKey,
    })
    expect((await byKey.fetch('/api/auth/session')).status).toBe(401)
    expect(
      await app.db
        .select()
        .from(schema.apikey)
        .where(eq(schema.apikey.referenceId, account.id)),
    ).toHaveLength(0)
  })

  it('unlinks avatar and upload ownership but keeps the shared assets', async () => {
    expect(
      await app.db
        .select()
        .from(schema.userAvatar)
        .where(eq(schema.userAvatar.userId, account.id)),
    ).toHaveLength(0)
    expect(
      await app.db
        .select()
        .from(schema.mediaUpload)
        .where(eq(schema.mediaUpload.uploaderId, account.id)),
    ).toHaveLength(0)
    const assets = await app.db
      .select({ id: schema.mediaAsset.id })
      .from(schema.mediaAsset)
    expect(assets.map((a) => a.id)).toEqual(
      expect.arrayContaining([uploadMediaId]),
    )
    expect((await fetch(avatarUrl)).status).toBe(200)
  })

  it('keeps contributions as pending with an anonymous author', async () => {
    const changesets = await app.db
      .select({
        authorId: schema.changeset.authorId,
        status: schema.changeset.status,
      })
      .from(schema.changeset)
      .where(eq(schema.changeset.id, changesetId))
    expect(changesets).toEqual([{ authorId: null, status: 'pending' }])
  })

  it('rejects a fresh sign-in with the old credentials', async () => {
    const signInAgain = await errorOf(signIn(other, account))
    expect(signInAgain?.code).toBe('UNAUTHORIZED')
  })
})
