import { eq, sql } from 'drizzle-orm'
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
} from '../harness'

describe('contribution media upload', () => {
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

  it('requires a verified account', async () => {
    const unverified = createTestHttp(app.baseUrl, {
      internalToken: INTERNAL_TOKEN,
    })
    await signUp(unverified)
    const error = await errorOf(
      unverified.client.media.upload({ file: await pngFile(20, 20) }),
    )
    expect(error?.code).toBe('FORBIDDEN')

    const anon = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    const anonError = await errorOf(
      anon.client.media.upload({ file: await pngFile(20, 20) }),
    )
    expect(anonError?.code).toBe('UNAUTHORIZED')
  })

  it('stores the asset, records the uploader and returns a usable media id', async () => {
    const result = await user.client.media.upload({
      file: await pngFile(120, 90, '#336699'),
    })
    expect(result).toMatchObject({ width: 120, height: 90 })
    expect(result.blurhash).toEqual(expect.any(String))
    expect((await fetch(result.url)).status).toBe(200)

    const uploads = await app.db
      .select()
      .from(schema.mediaUpload)
      .where(eq(schema.mediaUpload.uploaderId, account.id))
    expect(uploads).toHaveLength(1)
    expect(uploads[0]?.mediaAssetId).toBe(result.mediaId)

    const again = await user.client.media.upload({
      file: await pngFile(120, 90, '#336699'),
    })
    expect(again.mediaId).toBe(result.mediaId)
    expect(
      await app.db
        .select()
        .from(schema.mediaUpload)
        .where(eq(schema.mediaUpload.uploaderId, account.id)),
    ).toHaveLength(2)
  })

  it('rejects the upload once the rolling 24h quota is spent', async () => {
    const [asset] = await app.db
      .select({ id: schema.mediaAsset.id })
      .from(schema.mediaAsset)
      .limit(1)
    await app.db.insert(schema.mediaUpload).values(
      Array.from({ length: 98 }, () => ({
        mediaAssetId: asset!.id,
        uploaderId: account.id,
      })),
    )
    const blocked = await errorOf(
      user.client.media.upload({ file: await pngFile(30, 30, '#000000') }),
    )
    expect(blocked?.code).toBe('FORBIDDEN')
    expect(blocked?.message).toBe('Upload limit reached, try again later')

    await app.db
      .update(schema.mediaUpload)
      .set({ createdAt: sql`now() - interval '25 hours'` })
      .where(eq(schema.mediaUpload.uploaderId, account.id))
    const allowed = await user.client.media.upload({
      file: await pngFile(30, 30, '#000000'),
    })
    expect(allowed.width).toBe(30)
  })
})
