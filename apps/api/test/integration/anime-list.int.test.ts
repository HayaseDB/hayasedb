import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  createTestHttp,
  INTERNAL_TOKEN,
  signUpAdmin,
  type TestApp,
  type TestHttp,
} from '../harness'

describe('anime list', () => {
  let app: TestApp
  let admin: TestHttp
  let anon: TestHttp
  let drama: { id: string }

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    anon = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    drama = await admin.client.genre.create({ name: 'Drama' })
    const seeds = [
      {
        slug: 'alpha',
        titleEnglish: 'Alpha',
        format: 'TV',
        status: 'FINISHED',
        startDate: { year: 2000, month: 5 },
        genreIds: [drama.id],
      },
      {
        slug: 'beta',
        titleEnglish: 'beta',
        format: 'MOVIE',
        status: 'FINISHED',
        startDate: { year: 2000, month: 1, day: 2 },
      },
      {
        slug: 'gamma',
        titleRomaji: 'Gamma',
        format: 'TV',
        status: 'RELEASING',
        startDate: { year: 1995 },
      },
      {
        slug: 'delta',
        titleNative: 'デルタ',
        format: 'OVA',
        status: 'NOT_YET_RELEASED',
      },
    ] satisfies Array<Parameters<typeof admin.client.anime.create>[0]>
    for (const seed of seeds) await admin.client.anime.create(seed)
  })

  afterAll(async () => {
    await app.close()
  })

  it('paginates with stable totals', async () => {
    const page = await anon.client.anime.list({
      limit: 2,
      offset: 1,
      sort: 'title',
      order: 'asc',
    })
    expect(page.meta).toEqual({ total: 4, limit: 2, offset: 1 })
    expect(page.items.map((i) => i.slug)).toEqual(['beta', 'gamma'])
  })

  it('sorts by title case-insensitively, falling back across title columns', async () => {
    const asc = await anon.client.anime.list({ sort: 'title', order: 'asc' })
    expect(asc.items.map((i) => i.slug)).toEqual([
      'alpha',
      'beta',
      'gamma',
      'delta',
    ])
    const desc = await anon.client.anime.list({ sort: 'title', order: 'desc' })
    expect(desc.items.map((i) => i.slug)).toEqual([
      'delta',
      'gamma',
      'beta',
      'alpha',
    ])
  })

  it('sorts by fuzzy start date with nulls last in both directions', async () => {
    const desc = await anon.client.anime.list({ sort: 'start', order: 'desc' })
    expect(desc.items.map((i) => i.slug)).toEqual([
      'alpha',
      'beta',
      'gamma',
      'delta',
    ])
    const asc = await anon.client.anime.list({ sort: 'start', order: 'asc' })
    expect(asc.items.map((i) => i.slug)).toEqual([
      'gamma',
      'beta',
      'alpha',
      'delta',
    ])
  })

  it('filters by format, status, year, genre and search', async () => {
    const slugs = async (input: Parameters<typeof anon.client.anime.list>[0]) =>
      (
        await anon.client.anime.list({ ...input, sort: 'title', order: 'asc' })
      ).items.map((i) => i.slug)
    expect(await slugs({ format: 'TV' })).toEqual(['alpha', 'gamma'])
    expect(await slugs({ status: 'FINISHED', format: 'MOVIE' })).toEqual([
      'beta',
    ])
    expect(await slugs({ startYear: 2000 })).toEqual(['alpha', 'beta'])
    expect(await slugs({ genreId: drama.id })).toEqual(['alpha'])
    expect(await slugs({ q: 'デル' })).toEqual(['delta'])
    expect(await slugs({ q: 'GAM' })).toEqual(['gamma'])
    expect(await slugs({ q: 'zzz' })).toEqual([])
  })

  it('coerces query strings and rejects out-of-range limits', async () => {
    const raw = await anon.fetch(
      '/api/anime?limit=1&startYear=2000&sort=title&order=asc',
    )
    expect(raw.status).toBe(200)
    const body = (await raw.json()) as {
      items: Array<{ slug: string }>
      meta: { total: number }
    }
    expect(body.items.map((i) => i.slug)).toEqual(['alpha'])
    expect(body.meta.total).toBe(2)
    expect((await anon.fetch('/api/anime?limit=500')).status).toBe(400)
  })

  it('lists genre names and cover on items', async () => {
    const alpha = (await anon.client.anime.list({ q: 'alpha' })).items[0]
    expect(alpha).toMatchObject({
      genres: ['Drama'],
      coverUrl: null,
      coverBlurhash: null,
    })
  })
})
