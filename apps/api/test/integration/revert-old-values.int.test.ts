import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  animeCreate,
  createTestApp,
  createTestHttp,
  episodeCreate,
  errorOf,
  INTERNAL_TOKEN,
  seasonCreate,
  signUpAdmin,
  signUpVerified,
  type TestApp,
  type TestHttp,
} from '../harness'

describe('revert replays stored old values', () => {
  let app: TestApp
  let admin: TestHttp
  let user: TestHttp

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    user = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpVerified(user, app.mailer)
  })

  afterAll(async () => {
    await app.close()
  })

  it('restores only the fields an anime changeset touched', async () => {
    const anime = await admin.client.anime.create({
      slug: 'partial-revert',
      status: 'FINISHED',
      translations: [{ locale: 'en', title: 'Before', original: true }],
    })

    const edit = await user.client.changeset.submit({
      summary: 'Rename',
      changes: [
        {
          op: 'update',
          entityKind: 'anime',
          entityId: anime.id,
          baseRev: anime.headRev,
          payload: {
            translations: [{ locale: 'en', title: 'After', original: true }],
          },
        },
      ],
    })
    await admin.client.changeset.approve({ id: edit.id })

    await admin.client.anime.update({
      id: anime.id,
      status: 'RELEASING',
    })

    const reverted = await admin.client.changeset.revert({ id: edit.id })
    expect(reverted.status).toBe('approved')

    const after = await admin.client.anime.get({ id: anime.id })
    expect(after.title.title).toBe('Before')
    expect(after.status).toBe('RELEASING')
  })

  it('records the pre-change values on every reverting change', async () => {
    const genre = await admin.client.genre.create({
      slug: 'old-values-genre',
      translations: [{ locale: 'en', name: 'Original' }],
    })

    const edit = await user.client.changeset.submit({
      summary: 'Rename genre',
      changes: [
        {
          op: 'update',
          entityKind: 'genre',
          entityId: genre.id,
          baseRev: 1,
          payload: { translations: [{ locale: 'en', name: 'Renamed' }] },
        },
      ],
    })
    await admin.client.changeset.approve({ id: edit.id })

    const reverted = await admin.client.changeset.revert({ id: edit.id })
    const change = reverted.changes[0]
    expect(change?.oldValues).toEqual({
      translations: [{ locale: 'en', name: 'Renamed' }],
    })
    expect(change?.payload).toEqual({
      translations: [{ locale: 'en', name: 'Original' }],
    })
    expect(
      (await admin.client.genre.get({ id: genre.id })).translations,
    ).toEqual([{ locale: 'en', name: 'Original' }])
  })

  it('restores a season field without disturbing a concurrent edit', async () => {
    const anime = await admin.client.anime.create({
      slug: 'season-partial-revert',
      translations: [{ locale: 'en', title: 'Structured', original: true }],
    })
    const seasonId = randomUUID()
    const creation = await user.client.changeset.submit({
      summary: 'Add a season',
      changes: [seasonCreate(seasonId, anime.id, 0)],
    })
    await admin.client.changeset.approve({ id: creation.id })

    const created = await admin.client.season.get({ id: seasonId })
    const edit = await user.client.changeset.submit({
      summary: 'Retitle the season',
      changes: [
        {
          op: 'update',
          entityKind: 'animeSeason',
          entityId: seasonId,
          baseRev: created.headRev,
          payload: {
            translations: [{ locale: 'en', title: 'Renamed', original: true }],
          },
        },
      ],
    })
    await admin.client.changeset.approve({ id: edit.id })

    const renamed = await admin.client.season.get({ id: seasonId })
    expect(renamed.title?.title).toBe('Renamed')
    await admin.client.season.update({
      id: seasonId,
      kind: 'COUR',
    })

    await admin.client.changeset.revert({ id: edit.id })

    const reverted = await admin.client.season.get({ id: seasonId })
    expect(reverted.title?.title).toBe('Season 1')
    expect(reverted.kind).toBe('COUR')
  })

  it('restores an episode and its translations when its creation is reverted', async () => {
    const anime = await admin.client.anime.create({
      slug: 'episode-revert',
      translations: [{ locale: 'en', title: 'Episodic', original: true }],
    })
    const episodeId = randomUUID()
    const creation = await user.client.changeset.submit({
      summary: 'Add an episode',
      changes: [
        episodeCreate(episodeId, { animeId: anime.id }, 0, {
          translations: [
            {
              locale: 'en',
              title: 'Pilot',
              overview: 'The first one',
              original: true,
            },
            { locale: 'de', title: 'Pilotfolge', overview: null },
          ],
        }),
      ],
    })
    await admin.client.changeset.approve({ id: creation.id })

    const reverted = await admin.client.changeset.revert({ id: creation.id })
    expect(reverted.changes.map((change) => change.op)).toEqual(['delete'])
    expect(
      (await errorOf(admin.client.episode.get({ id: episodeId })))?.code,
    ).toBe('NOT_FOUND')

    await admin.client.changeset.revert({ id: reverted.id })

    const restored = await admin.client.episode.get({ id: episodeId })
    expect(restored.translations).toEqual([
      { locale: 'de', title: 'Pilotfolge', overview: null, original: false },
      {
        locale: 'en',
        title: 'Pilot',
        overview: 'The first one',
        original: true,
      },
    ])
  })

  it('reverts a whole anime document when a deletion is undone', async () => {
    const animeId = randomUUID()
    const creation = await user.client.changeset.submit({
      summary: 'Add an anime',
      changes: [
        animeCreate(animeId, 'deletable-anime', {
          status: 'FINISHED',
          translations: [
            {
              locale: 'en',
              title: 'Deletable',
              description: 'Kept through a revert',
              original: true,
            },
          ],
        }),
      ],
    })
    await admin.client.changeset.approve({ id: creation.id })

    const live = await admin.client.anime.get({ id: animeId })
    const removal = await user.client.changeset.submit({
      summary: 'Delete it',
      changes: [
        {
          op: 'delete',
          entityKind: 'anime',
          entityId: animeId,
          baseRev: live.headRev,
        },
      ],
    })
    await admin.client.changeset.approve({ id: removal.id })
    expect((await errorOf(user.client.anime.get({ id: animeId })))?.code).toBe(
      'NOT_FOUND',
    )

    await admin.client.changeset.revert({ id: removal.id })

    const restored = await admin.client.anime.get({ id: animeId })
    expect(restored).toMatchObject({
      slug: 'deletable-anime',
      status: 'FINISHED',
      description: 'Kept through a revert',
    })
    expect(restored.title.title).toBe('Deletable')
  })
})
