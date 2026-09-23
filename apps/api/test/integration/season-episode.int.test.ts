import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createAnimeInput,
  episodeCreate,
  seasonCreate,
} from '../harness/helpers'
import {
  createTestApp,
  createTestHttp,
  errorOf,
  INTERNAL_TOKEN,
  signUpAdmin,
  signUpVerified,
  type TestApp,
  type TestHttp,
} from '../harness'

const episodeFields = {
  number: '1',
  type: 'REGULAR' as const,
  status: 'UPCOMING' as const,
  airDate: null,
  durationSeconds: 1440,
  stillMediaId: null,
}

describe('anime seasons and episodes', () => {
  let app: TestApp
  let admin: TestHttp
  let contributor: TestHttp

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    contributor = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpVerified(contributor, app.mailer)
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves localized episodes and allows seasons beside direct episodes', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('flat-episodes'),
    )
    const episode = await admin.client.episode.createForAnime({
      animeId: anime.id,
      ...episodeFields,
      translations: [
        { locale: 'en', title: 'Asteroid Blues' },
        { locale: 'ja-Jpan', title: 'アステロイド・ブルース', original: true },
      ],
    })
    expect(episode).toMatchObject({
      animeId: anime.id,
      seasonId: null,
      position: 0,
      headRev: 1,
      title: { locale: 'en' },
    })

    const localized = await admin.fetch(`/api/episodes/${episode.id}`)
    expect(localized.status).toBe(200)
    const body = (await localized.json()) as { title: { locale: string } }
    expect(body.title).toMatchObject({ locale: 'en', title: 'Asteroid Blues' })

    const beside = await admin.client.season.create({
      animeId: anime.id,
      kind: 'SEASON',
      number: null,
    })
    expect(beside).toMatchObject({ animeId: anime.id, position: 1 })
    await admin.client.season.remove({ id: beside.id })

    const renamed = await admin.client.episode.update({
      id: episode.id,
      translations: [{ locale: 'en', title: 'Asteroid Blues', original: true }],
    })
    expect(renamed.title).toMatchObject({ locale: 'en', original: true })
    expect(renamed.headRev).toBe(2)

    await admin.client.episode.remove({ id: episode.id })
    const season = await admin.client.season.create({
      animeId: anime.id,
      kind: 'SEASON',
      number: '1',
      translations: [{ locale: 'en', title: 'Season One', original: true }],
    })
    expect(season.position).toBe(0)

    const grouped = await admin.client.episode.createForSeason({
      seasonId: season.id,
      ...episodeFields,
    })
    expect(grouped).toMatchObject({ animeId: null, seasonId: season.id })
    expect(
      (await admin.client.episode.listForAnime({ animeId: anime.id })).items,
    ).toMatchObject([{ id: grouped.id, seasonId: season.id }])

    expect(
      (await errorOf(admin.client.season.remove({ id: season.id })))?.code,
    ).toBe('CONFLICT')
  })

  it('reorders behind the order precondition and records one changeset', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('episode-order'),
    )
    const first = await admin.client.episode.createForAnime({
      animeId: anime.id,
      ...episodeFields,
    })
    const second = await admin.client.episode.createForAnime({
      animeId: anime.id,
      ...episodeFields,
      number: '2',
    })
    const list = await admin.client.episode.listForAnime({ animeId: anime.id })

    const stale = await errorOf(
      admin.client.episode.reorderForAnime({
        animeId: anime.id,
        orderedIds: [second.id, first.id],
        expectedOrderEtag: `${list.orderEtag}-stale`,
      }),
    )
    expect(stale?.code).toBe('PRECONDITION_FAILED')

    const partial = await errorOf(
      admin.client.episode.reorderForAnime({
        animeId: anime.id,
        orderedIds: [second.id],
        expectedOrderEtag: list.orderEtag,
      }),
    )
    expect(partial?.code).toBe('BAD_REQUEST')

    const reordered = await admin.client.episode.reorderForAnime({
      animeId: anime.id,
      orderedIds: [second.id, first.id],
      expectedOrderEtag: list.orderEtag,
    })
    expect(reordered.items.map((item) => [item.id, item.position])).toEqual([
      [second.id, 0],
      [first.id, 1],
    ])

    const changesets = await app.db
      .select()
      .from(schema.changeset)
      .where(eq(schema.changeset.status, 'approved'))
    expect(
      changesets.filter((row) => row.summary.startsWith('Reorder episodes')),
    ).toHaveLength(1)
  })

  it('creates a season and its episode through one reviewable changeset', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('contributed-season'),
    )
    const seasonId = '00000000-0000-7000-8000-000000000101'
    const episodeId = '00000000-0000-7000-8000-000000000102'
    const submitted = await contributor.client.changeset.submit({
      summary: 'Add season and first episode',
      changes: [
        seasonCreate(seasonId, anime.id, 0),
        episodeCreate(episodeId, { seasonId }, 0),
      ],
    })
    expect(submitted.changes.map((change) => change.entityKind)).toEqual([
      'animeSeason',
      'animeEpisode',
    ])

    await admin.client.changeset.approve({ id: submitted.id })
    expect(await admin.client.season.get({ id: seasonId })).toMatchObject({
      animeId: anime.id,
      episodeCount: 1,
    })
    expect(await admin.client.episode.get({ id: episodeId })).toMatchObject({
      seasonId,
      headRev: 1,
    })
  })

  it('applies a changeset that puts a direct episode beside a season', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('mixed-structure'),
    )
    const seasonId = '00000000-0000-7000-8000-000000000201'
    const episodeId = '00000000-0000-7000-8000-000000000202'
    const submitted = await contributor.client.changeset.submit({
      summary: 'Add a season and a direct episode',
      changes: [
        seasonCreate(seasonId, anime.id, 0),
        episodeCreate(episodeId, { animeId: anime.id }, 1),
      ],
    })

    const decision = await admin.client.changeset.approve({ id: submitted.id })
    expect(decision.status).toBe('approved')
    expect(await admin.client.season.get({ id: seasonId })).toMatchObject({
      animeId: anime.id,
      position: 0,
    })
    expect(await admin.client.episode.get({ id: episodeId })).toMatchObject({
      animeId: anime.id,
      seasonId: null,
      position: 1,
    })
  })

  it('reads a direct episode between two seasons in rank order', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('interleaved-children'),
    )
    const first = await admin.client.season.create({
      animeId: anime.id,
      kind: 'SEASON',
      number: '1',
    })
    const between = await admin.client.episode.createForAnime({
      animeId: anime.id,
      ...episodeFields,
    })
    const second = await admin.client.season.create({
      animeId: anime.id,
      kind: 'SEASON',
      number: '2',
    })
    expect([first.position, between.position, second.position]).toEqual([
      0, 1, 2,
    ])

    const inFirst = await admin.client.episode.createForSeason({
      seasonId: first.id,
      ...episodeFields,
    })
    const inSecond = await admin.client.episode.createForSeason({
      seasonId: second.id,
      ...episodeFields,
    })

    const listed = await admin.client.episode.listForAnime({
      animeId: anime.id,
    })
    expect(listed.items.map((item) => item.id)).toEqual([
      inFirst.id,
      between.id,
      inSecond.id,
    ])
  })

  it('blocks a changeset that puts two anime children at one position', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('duplicate-rank'),
    )
    const seasonId = '00000000-0000-7000-8000-000000000211'
    const episodeId = '00000000-0000-7000-8000-000000000212'
    const submitted = await contributor.client.changeset.submit({
      summary: 'Add a season and a direct episode at the same position',
      changes: [
        seasonCreate(seasonId, anime.id, 0),
        episodeCreate(episodeId, { animeId: anime.id }, 0),
      ],
    })

    const decision = await admin.client.changeset.approve({ id: submitted.id })
    expect(decision.status).toBe('pending')
    expect(
      (await errorOf(admin.client.season.get({ id: seasonId })))?.code,
    ).toBe('NOT_FOUND')
  })

  it('restores a season and its translations when a delete is reverted', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('revertible-season'),
    )
    const season = await admin.client.season.create({
      animeId: anime.id,
      kind: 'SEASON',
      number: '1',
      translations: [{ locale: 'en', title: 'Season One', original: true }],
    })

    const removal = await contributor.client.changeset.submit({
      summary: 'Remove the season',
      changes: [
        {
          op: 'delete',
          entityKind: 'animeSeason',
          entityId: season.id,
          baseRev: season.headRev,
        },
      ],
    })
    await admin.client.changeset.approve({ id: removal.id })
    expect(
      (await errorOf(admin.client.season.get({ id: season.id })))?.code,
    ).toBe('NOT_FOUND')

    await admin.client.changeset.revert({ id: removal.id })
    const restored = await admin.client.season.get({ id: season.id })
    expect(restored).toMatchObject({
      animeId: anime.id,
      title: { locale: 'en', title: 'Season One' },
    })
  })

  it('reports the parent anime and a label for an episode-only changeset', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('episode-parents'),
    )
    const season = await admin.client.season.create({
      animeId: anime.id,
      kind: 'SEASON',
      number: '1',
      translations: [{ locale: 'en', title: 'Season One', original: true }],
    })
    const grouped = await admin.client.episode.createForSeason({
      seasonId: season.id,
      ...episodeFields,
      number: '3',
    })

    const detail = await admin.client.changeset.submit({
      summary: 'Fix the runtime of a single episode',
      changes: [
        {
          op: 'update',
          entityKind: 'animeEpisode',
          entityId: grouped.id,
          baseRev: grouped.headRev,
          payload: { durationSeconds: 1500 },
        },
      ],
    })

    const change = detail.changes[0]!
    expect(change.payload).toEqual({ durationSeconds: 1500 })

    const parent = detail.display.parents[change.id]
    expect(parent).toMatchObject({
      animeId: anime.id,
      seasonId: season.id,
      label: 'Episode 3',
    })
    expect(detail.display.refs.anime?.[anime.id]).toBeTruthy()
    expect(detail.display.refs.animeSeason?.[season.id]).toBe('Season One')

    const context = detail.display.contexts[anime.id]
    expect(context).toBeTruthy()
    expect(context).toMatchObject({ slug: 'episode-parents' })

    expect(detail.display.contexts[season.id]).toMatchObject({
      kind: 'SEASON',
    })
  })

  it('reports parentage for a season and episode created in one changeset', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('nest-creates'),
    )
    const seasonId = crypto.randomUUID()
    const episodeId = crypto.randomUUID()

    const detail = await admin.client.changeset.submit({
      summary: 'Create a season and one episode inside it',
      changes: [
        seasonCreate(seasonId, anime.id, 0),
        episodeCreate(episodeId, { seasonId }, 0),
      ],
    })

    const byEntity = new Map(
      detail.changes.map((change) => [change.entityId, change]),
    )
    const parentOf = (entityId: string) =>
      detail.display.parents[byEntity.get(entityId)!.id]

    expect(parentOf(seasonId)).toMatchObject({ animeId: anime.id })
    expect(parentOf(episodeId)).toMatchObject({
      animeId: anime.id,
      seasonId,
    })
  })

  it('nests every episode of a newly created season under that season', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('nest-many-episodes'),
    )
    const seasonId = crypto.randomUUID()
    const episodeIds = [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    ]

    const detail = await admin.client.changeset.submit({
      summary: 'Create a season with three episodes',
      changes: [
        seasonCreate(seasonId, anime.id, 0),
        ...episodeIds.map((id, index) =>
          episodeCreate(id, { seasonId }, index),
        ),
      ],
    })

    const byEntity = new Map(
      detail.changes.map((change) => [change.entityId, change]),
    )
    for (const id of episodeIds) {
      expect(detail.display.parents[byEntity.get(id)!.id]).toMatchObject({
        animeId: anime.id,
        seasonId,
      })
    }
  })

  it('reports the full anime, season and episode parentage in one changeset', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('nest-chain'),
    )
    const season = await admin.client.season.create({
      animeId: anime.id,
      kind: 'SEASON',
      number: '1',
      translations: [{ locale: 'en', title: 'Season One', original: true }],
    })
    const grouped = await admin.client.episode.createForSeason({
      seasonId: season.id,
      ...episodeFields,
      number: '3',
    })
    const standalone = await admin.client.episode.createForAnime({
      animeId: anime.id,
      ...episodeFields,
      number: '4',
    })

    const detail = await admin.client.changeset.submit({
      summary: 'Edit a season, its episode and a standalone episode',
      changes: [
        {
          op: 'update',
          entityKind: 'animeSeason',
          entityId: season.id,
          baseRev: season.headRev,
          payload: { number: '2' },
        },
        {
          op: 'update',
          entityKind: 'animeEpisode',
          entityId: grouped.id,
          baseRev: grouped.headRev,
          payload: { durationSeconds: 1500 },
        },
        {
          op: 'update',
          entityKind: 'animeEpisode',
          entityId: standalone.id,
          baseRev: standalone.headRev,
          payload: { durationSeconds: 1600 },
        },
      ],
    })

    const byEntity = new Map(
      detail.changes.map((change) => [change.entityId, change]),
    )
    const parentOf = (entityId: string) =>
      detail.display.parents[byEntity.get(entityId)!.id]

    expect(parentOf(season.id)).toMatchObject({
      animeId: anime.id,
      seasonId: null,
    })
    expect(parentOf(grouped.id)).toMatchObject({
      animeId: anime.id,
      seasonId: season.id,
    })
    expect(parentOf(standalone.id)).toMatchObject({
      animeId: anime.id,
      seasonId: null,
    })
  })

  it('still sends the anime context when the anime is edited in the same changeset', async () => {
    const anime = await admin.client.anime.create(
      createAnimeInput('episode-context-edited'),
    )
    const season = await admin.client.season.create({
      animeId: anime.id,
      kind: 'SEASON',
      number: '1',
      translations: [{ locale: 'en', title: 'Season One', original: true }],
    })
    const grouped = await admin.client.episode.createForSeason({
      seasonId: season.id,
      ...episodeFields,
      number: '3',
    })

    const detail = await admin.client.changeset.submit({
      summary: 'Edit the anime and one of its episodes',
      changes: [
        {
          op: 'update',
          entityKind: 'anime',
          entityId: anime.id,
          baseRev: anime.headRev,
          payload: { slug: 'episode-context-renamed' },
        },
        {
          op: 'update',
          entityKind: 'animeEpisode',
          entityId: grouped.id,
          baseRev: grouped.headRev,
          payload: { durationSeconds: 1500 },
        },
      ],
    })

    expect(detail.display.contexts[anime.id]).toMatchObject({
      slug: 'episode-context-edited',
    })
  })
})
