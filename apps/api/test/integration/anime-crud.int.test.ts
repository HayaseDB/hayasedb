import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  animeBySlug,
  createTestApp,
  createTestHttp,
  errorOf,
  INTERNAL_TOKEN,
  signUpAdmin,
  signUpVerified,
  type TestApp,
  type TestHttp,
} from '../harness'

describe('anime CRUD', () => {
  let app: TestApp
  let admin: TestHttp
  let user: TestHttp
  let anon: TestHttp

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    user = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpVerified(user, app.mailer)
    anon = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
  })

  afterAll(async () => {
    await app.close()
  })

  it('rejects writes from non-admins and anonymous callers', async () => {
    const forbidden = await errorOf(user.client.anime.create({ slug: 'nope' }))
    expect(forbidden?.code).toBe('FORBIDDEN')
    const unauthorized = await errorOf(
      anon.client.anime.create({ slug: 'nope' }),
    )
    expect(unauthorized?.code).toBe('UNAUTHORIZED')
  })

  it('creates with genres, fuzzy dates and a first revision, then reads back by id and slug', async () => {
    const genre = await admin.client.genre.create({ name: 'Action' })
    const created = await admin.client.anime.create({
      slug: 'cowboy-bebop',
      titleEnglish: 'Cowboy Bebop',
      titleRomaji: '',
      format: 'TV',
      status: 'FINISHED',
      startDate: '1998-04-03',
      endDate: { year: 1999, month: 4 },
      genreIds: [genre.id, genre.id],
    })
    expect(created).toMatchObject({
      slug: 'cowboy-bebop',
      titleRomaji: null,
      startDate: { year: 1998, month: 4, day: 3 },
      endDate: { year: 1999, month: 4, day: null },
      genres: [{ id: genre.id, name: 'Action' }],
      headRev: 1,
      deletedAt: null,
    })

    expect(await animeBySlug(anon.client, 'cowboy-bebop')).toMatchObject({
      id: created.id,
    })
    expect(await anon.client.anime.get({ id: created.id })).toMatchObject({
      slug: 'cowboy-bebop',
    })

    const revisions = await app.db
      .select()
      .from(schema.entityRevision)
      .where(eq(schema.entityRevision.entityId, created.id))
    expect(revisions).toHaveLength(1)
    expect(revisions[0]).toMatchObject({ op: 'create', rev: 1 })
  })

  it('validates fuzzy dates and slugs at the boundary', async () => {
    const badDay = await errorOf(
      admin.client.anime.create({
        slug: 'bad-day',
        startDate: { year: 2024, month: 2, day: 30 },
      }),
    )
    expect(badDay?.code).toBe('BAD_REQUEST')
    const dayWithoutMonth = await errorOf(
      admin.client.anime.create({
        slug: 'bad-day',
        startDate: { year: 2024, day: 3 },
      }),
    )
    expect(dayWithoutMonth?.code).toBe('BAD_REQUEST')
    const badSlug = await errorOf(
      admin.client.anime.create({ slug: 'Bad Slug' }),
    )
    expect(badSlug?.code).toBe('BAD_REQUEST')
  })

  it('refuses duplicate slugs on create and update with CONFLICT', async () => {
    await admin.client.anime.create({ slug: 'taken' })
    const other = await admin.client.anime.create({ slug: 'other' })
    const dup = await errorOf(admin.client.anime.create({ slug: 'taken' }))
    expect(dup?.code).toBe('CONFLICT')
    const move = await errorOf(
      admin.client.anime.update({ id: other.id, slug: 'taken' }),
    )
    expect(move?.code).toBe('CONFLICT')
    const same = await admin.client.anime.update({
      id: other.id,
      slug: 'other',
    })
    expect(same.slug).toBe('other')
  })

  it('rejects unknown genre references with NOT_FOUND', async () => {
    const error = await errorOf(
      admin.client.anime.create({
        slug: 'ghost-genre',
        genreIds: ['00000000-0000-7000-8000-000000000000'],
      }),
    )
    expect(error?.code).toBe('NOT_FOUND')
  })

  it('patches only provided fields and bumps headRev per write', async () => {
    const created = await admin.client.anime.create({
      slug: 'patchy',
      titleEnglish: 'Before',
    })
    const updated = await admin.client.anime.update({
      id: created.id,
      description: 'Desc',
    })
    expect(updated).toMatchObject({
      titleEnglish: 'Before',
      description: 'Desc',
      headRev: 2,
    })
    const cleared = await admin.client.anime.update({
      id: created.id,
      titleEnglish: '',
    })
    expect(cleared).toMatchObject({ titleEnglish: null, headRev: 3 })
    const noop = await admin.client.anime.update({ id: created.id })
    expect(noop.headRev).toBe(3)
  })

  it('stores relations once and shows the inverse on the other side', async () => {
    const a = await admin.client.anime.create({
      slug: 'rel-a',
      startDate: { year: 2001 },
    })
    const b = await admin.client.anime.create({
      slug: 'rel-b',
      startDate: { year: 2002 },
    })
    const c = await admin.client.anime.create({ slug: 'rel-c' })
    const self = await errorOf(
      admin.client.anime.update({
        id: a.id,
        relations: [{ targetId: a.id, kind: 'SEQUEL' }],
      }),
    )
    expect(self?.code).toBe('NOT_FOUND')
    expect(self?.message).toContain('cannot relate to itself')

    const updated = await admin.client.anime.update({
      id: a.id,
      relations: [
        { targetId: b.id, kind: 'SEQUEL' },
        { targetId: c.id, kind: 'ALTERNATIVE' },
      ],
    })
    expect(
      updated.relations.map((r) => [r.kind, r.anime.slug, r.owned]),
    ).toEqual([
      ['SEQUEL', 'rel-b', true],
      ['ALTERNATIVE', 'rel-c', true],
    ])

    const fromB = await animeBySlug(anon.client, 'rel-b')
    expect(fromB.relations).toMatchObject([
      { kind: 'PREQUEL', owned: false, anime: { slug: 'rel-a' } },
    ])
    const fromC = await animeBySlug(anon.client, 'rel-c')
    expect(fromC.relations).toMatchObject([
      { kind: 'ALTERNATIVE', anime: { slug: 'rel-a' } },
    ])

    const rows = await app.db.select().from(schema.animeRelation)
    expect(
      rows.filter((r) => [r.sourceId, r.targetId].includes(a.id)),
    ).toHaveLength(2)

    await admin.client.anime.update({ id: a.id, relations: [] })
    expect((await animeBySlug(anon.client, 'rel-b')).relations).toEqual([])
  })

  it('soft deletes: hidden from public reads and list, visible to admins with includeDeleted', async () => {
    const created = await admin.client.anime.create({ slug: 'gone' })
    await admin.client.anime.remove({ id: created.id })

    const missing = await errorOf(animeBySlug(anon.client, 'gone'))
    expect(missing?.code).toBe('NOT_FOUND')
    const listed = await anon.client.anime.list({ q: 'gone' })
    expect(listed.meta.total).toBe(0)

    const asAdmin = await animeBySlug(admin.client, 'gone', {
      includeDeleted: true,
    })
    expect(asAdmin.deletedAt).not.toBeNull()
    expect(
      (await admin.client.anime.list({ q: 'gone', includeDeleted: true })).meta
        .total,
    ).toBe(1)
    expect(
      (await user.client.anime.list({ q: 'gone', includeDeleted: true })).meta
        .total,
    ).toBe(0)

    const again = await errorOf(admin.client.anime.remove({ id: created.id }))
    expect(again?.code).toBe('NOT_FOUND')
    const edit = await errorOf(
      admin.client.anime.update({ id: created.id, description: 'x' }),
    )
    expect(edit?.code).toBe('NOT_FOUND')
  })
})
