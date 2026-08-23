import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  createTestHttp,
  errorOf,
  fakePng,
  INTERNAL_TOKEN,
  pngFile,
  signUpAdmin,
  signUpVerified,
  type TestApp,
  type TestHttp,
  textFile,
} from '../harness'

describe('anime media', () => {
  let app: TestApp
  let admin: TestHttp
  let user: TestHttp
  let animeId: string

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    user = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpVerified(user, app.mailer)
    const created = await admin.client.anime.create({
      slug: 'media-anime',
      titleEnglish: 'Media Anime',
    })
    animeId = created.id
  })

  afterAll(async () => {
    await app.close()
  })

  it('rejects media writes from non-admins', async () => {
    const error = await errorOf(
      user.client.anime.addMedia({
        animeId,
        type: 'COVER',
        file: await pngFile(32, 32),
      }),
    )
    expect(error?.code).toBe('FORBIDDEN')
  })

  it('stores a processed webp in the bucket, serves it publicly and records a revision', async () => {
    const detail = await admin.client.anime.addMedia({
      animeId,
      type: 'COVER',
      file: await pngFile(300, 450),
    })
    expect(detail.media).toHaveLength(1)
    const [cover] = detail.media
    expect(cover).toMatchObject({
      type: 'COVER',
      position: 0,
      width: 300,
      height: 450,
    })
    expect(cover?.blurhash).toEqual(expect.any(String))
    expect(cover?.url).toMatch(/\.webp$/)

    const response = await fetch(cover!.url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/webp')
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    )

    const [asset] = await app.db
      .select()
      .from(schema.mediaAsset)
      .where(eq(schema.mediaAsset.id, cover!.mediaId))
    expect(asset?.mimeType).toBe('image/webp')
    expect(asset?.checksumSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(asset?.storageKey).toContain(asset!.checksumSha256.slice(0, 2))
    expect(detail.headRev).toBe(2)
  })

  it('downscales oversized images to the maximum dimension', async () => {
    const detail = await admin.client.anime.addMedia({
      animeId,
      type: 'BANNER',
      file: await pngFile(4096, 1024, '#00ff00'),
    })
    const banner = detail.media.find((m) => m.type === 'BANNER')
    expect(banner).toMatchObject({ width: 2048, height: 512, position: 0 })
  })

  it('dedupes identical uploads by content hash and ignores duplicate links', async () => {
    const first = await admin.client.anime.addMedia({
      animeId,
      type: 'GALLERY',
      file: await pngFile(100, 100, '#123456', 'a.png'),
    })
    const second = await admin.client.anime.addMedia({
      animeId,
      type: 'GALLERY',
      file: await pngFile(100, 100, '#123456', 'b.png'),
    })
    const shots = second.media.filter((m) => m.type === 'GALLERY')
    expect(shots).toHaveLength(1)
    expect(shots[0]?.mediaId).toBe(
      first.media.find((m) => m.type === 'GALLERY')?.mediaId,
    )

    const assets = await app.db
      .select({ id: schema.mediaAsset.id })
      .from(schema.mediaAsset)
    expect(assets.map((a) => a.id)).toContain(shots[0]?.mediaId)
    expect(assets.filter((a) => a.id === shots[0]?.mediaId)).toHaveLength(1)

    const other = await admin.client.anime.create({ slug: 'media-anime-2' })
    const reused = await admin.client.anime.addMedia({
      animeId: other.id,
      type: 'COVER',
      file: await pngFile(100, 100, '#123456', 'c.png'),
    })
    expect(reused.media[0]?.mediaId).toBe(shots[0]?.mediaId)
  })

  it('rejects non-image payloads at the schema and the decoder', async () => {
    const wrongMime = await errorOf(
      admin.client.anime.addMedia({ animeId, type: 'COVER', file: textFile() }),
    )
    expect(wrongMime?.code).toBe('BAD_REQUEST')

    const corrupt = await errorOf(
      admin.client.anime.addMedia({ animeId, type: 'COVER', file: fakePng() }),
    )
    expect(corrupt?.code).toBe('UNPROCESSABLE_CONTENT')
    expect(corrupt?.message).toBe('The uploaded file is not a valid image')
    const raw = new FormData()
    raw.set('file', fakePng())
    raw.set('type', 'COVER')
    const response = await admin.fetch(`/api/anime/${animeId}/media`, {
      method: 'POST',
      body: raw,
    })
    expect(response.status).toBe(422)
  })

  it('appends positions per type, reorders only within the given type and removes by link id', async () => {
    const own = await admin.client.anime.create({ slug: 'media-anime-order' })
    const animeId = own.id
    await admin.client.anime.addMedia({
      animeId,
      type: 'COVER',
      file: await pngFile(120, 180, '#0000aa'),
    })
    await admin.client.anime.addMedia({
      animeId,
      type: 'GALLERY',
      file: await pngFile(80, 60, '#aa00aa'),
    })
    const s2 = await admin.client.anime.addMedia({
      animeId,
      type: 'GALLERY',
      file: await pngFile(80, 60, '#aa0000'),
    })
    const s3 = await admin.client.anime.addMedia({
      animeId,
      type: 'GALLERY',
      file: await pngFile(80, 60, '#00aa00'),
    })
    const shots = s3.media
      .filter((m) => m.type === 'GALLERY')
      .sort((a, b) => a.position - b.position)
    expect(shots.map((m) => m.position)).toEqual([0, 1, 2])
    expect(s2.media.filter((m) => m.type === 'GALLERY')).toHaveLength(2)

    const reordered = await admin.client.anime.reorderMedia({
      animeId,
      type: 'GALLERY',
      orderedIds: [shots[2]!.id, shots[0]!.id, shots[1]!.id],
    })
    const after = reordered.media
      .filter((m) => m.type === 'GALLERY')
      .sort((a, b) => a.position - b.position)
    expect(after.map((m) => m.id)).toEqual([
      shots[2]!.id,
      shots[0]!.id,
      shots[1]!.id,
    ])
    const cover = reordered.media.find((m) => m.type === 'COVER')
    expect(cover?.position).toBe(0)

    const foreign = await admin.client.anime.reorderMedia({
      animeId,
      type: 'COVER',
      orderedIds: [shots[1]!.id],
    })
    expect(foreign.media.find((m) => m.id === shots[1]!.id)?.position).toBe(2)

    const removed = await admin.client.anime.removeMedia({ id: shots[0]!.id })
    expect(removed.media.map((m) => m.id)).not.toContain(shots[0]!.id)
    const [asset] = await app.db
      .select({ id: schema.mediaAsset.id })
      .from(schema.mediaAsset)
      .where(eq(schema.mediaAsset.id, shots[0]!.mediaId))
    expect(asset).toBeDefined()

    const again = await errorOf(
      admin.client.anime.removeMedia({ id: shots[0]!.id }),
    )
    expect(again?.code).toBe('NOT_FOUND')
  })

  it('refuses media on unknown or deleted anime', async () => {
    const ghost = await admin.client.anime.create({ slug: 'ghost' })
    await admin.client.anime.remove({ id: ghost.id })
    const error = await errorOf(
      admin.client.anime.addMedia({
        animeId: ghost.id,
        type: 'COVER',
        file: await pngFile(10, 10),
      }),
    )
    expect(error?.code).toBe('NOT_FOUND')
  })
})
