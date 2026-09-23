import { describe, expect, it } from 'vitest'
import {
  applyStructurePrefill,
  emptyStructureState,
  newEpisodeDraft,
  newSeasonDraft,
  planStructureChanges,
  preferredStructureTitle,
  type AnimeStructureState,
  type EpisodeDraft,
  type SeasonDraft,
} from './animeStructureForm'
const UUID = (n: number) =>
  `00000000-0000-7000-8000-${String(n).padStart(12, '0')}`

const ANIME = UUID(1)
const SEASON = UUID(2)
const EPISODE = UUID(3)

function episode(overrides: Partial<EpisodeDraft> = {}): EpisodeDraft {
  return {
    ...newEpisodeDraft(),
    id: EPISODE,
    isNew: false,
    baseRev: 1,
    number: '1',
    translations: [
      { locale: 'en', title: 'First', overview: null, original: true },
    ],
    ...overrides,
  }
}

function season(overrides: Partial<SeasonDraft> = {}): SeasonDraft {
  return {
    ...newSeasonDraft(),
    id: SEASON,
    isNew: false,
    baseRev: 1,
    translations: [{ locale: 'en', title: 'Season 1', original: true }],
    ...overrides,
  }
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe('planStructureChanges', () => {
  it('emits nothing when nothing changed', () => {
    const state: AnimeStructureState = {
      seasons: [season({ episodes: [episode()] })],
      episodes: [],
    }
    expect(planStructureChanges(ANIME, state, clone(state))).toEqual([])
  })

  it('creates a season and its episodes', () => {
    const fresh = newSeasonDraft()
    const child = newEpisodeDraft()
    child.translations[0]!.title = 'Pilot'
    fresh.episodes = [child]

    const changes = planStructureChanges(
      ANIME,
      { seasons: [fresh], episodes: [] },
      emptyStructureState(),
    )

    expect(changes).toHaveLength(2)
    expect(changes[0]).toMatchObject({
      op: 'create',
      entityKind: 'animeSeason',
      entityId: fresh.id,
    })
    expect(changes[1]).toMatchObject({
      op: 'create',
      entityKind: 'animeEpisode',
      entityId: child.id,
      payload: { seasonId: fresh.id, animeId: null, position: 0 },
    })
  })

  it('updates only the episode that actually changed', () => {
    const first = episode({ id: UUID(4), number: '1' })
    const second = episode({ id: UUID(5), number: '2' })
    const baseline: AnimeStructureState = {
      seasons: [season({ episodes: [first, second] })],
      episodes: [],
    }
    const next = clone(baseline)
    next.seasons[0]!.episodes[1]!.translations[0]!.title = 'Renamed'

    const changes = planStructureChanges(ANIME, next, baseline)

    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({
      op: 'update',
      entityKind: 'animeEpisode',
      entityId: UUID(5),
      baseRev: 1,
    })
  })

  it('deletes existing rows and drops never-saved ones', () => {
    const saved = episode({ id: UUID(4) })
    const unsaved = newEpisodeDraft()
    const baseline: AnimeStructureState = {
      seasons: [],
      episodes: [saved],
    }
    const next: AnimeStructureState = {
      seasons: [],
      episodes: [
        { ...clone(saved), removed: true },
        { ...unsaved, removed: true },
      ],
    }

    const changes = planStructureChanges(ANIME, next, baseline)

    expect(changes).toEqual([
      {
        op: 'delete',
        entityKind: 'animeEpisode',
        entityId: UUID(4),
        baseRev: 1,
      },
    ])
  })

  it('carries baseRev on updates so the server can detect conflicts', () => {
    const baseline: AnimeStructureState = {
      seasons: [season({ baseRev: 7 })],
      episodes: [],
    }
    const next = clone(baseline)
    next.seasons[0]!.kind = 'COUR'

    const [change] = planStructureChanges(ANIME, next, baseline)

    expect(change).toMatchObject({ op: 'update', baseRev: 7 })
  })

  it('reindexes positions when episodes are reordered', () => {
    const first = episode({ id: UUID(4), number: '1' })
    const second = episode({ id: UUID(5), number: '2' })
    const baseline: AnimeStructureState = {
      seasons: [],
      episodes: [first, second],
    }
    const next: AnimeStructureState = {
      seasons: [],
      episodes: [clone(second), clone(first)],
    }

    const changes = planStructureChanges(ANIME, next, baseline)

    expect(changes).toHaveLength(2)
    expect(changes).toContainEqual(
      expect.objectContaining({
        entityId: UUID(5),
        payload: expect.objectContaining({ position: 0 }),
      }),
    )
    expect(changes).toContainEqual(
      expect.objectContaining({
        entityId: UUID(4),
        payload: expect.objectContaining({ position: 1 }),
      }),
    )
  })

  it('omits translations left blank', () => {
    const fresh = newEpisodeDraft()
    const changes = planStructureChanges(
      ANIME,
      { seasons: [], episodes: [fresh] },
      emptyStructureState(),
    )

    expect(changes[0]).toMatchObject({
      payload: { translations: [] },
    })
  })
})

describe('applyStructurePrefill', () => {
  it('replays a superseded changeset so it diffs as a change again', () => {
    const state = emptyStructureState()
    const animeId = UUID(1)
    const seasonId = UUID(2)
    const episodeId = UUID(3)

    applyStructurePrefill(state, [
      {
        entityKind: 'animeSeason',
        entityId: seasonId,
        op: 'create',
        payload: {
          animeId,
          kind: 'SEASON',
          number: null,
          translations: [{ locale: 'en', title: 'First', original: true }],
        },
      },
      {
        entityKind: 'animeEpisode',
        entityId: episodeId,
        op: 'create',
        payload: {
          animeId: null,
          seasonId,
          number: '1',
          type: 'REGULAR',
          status: 'RELEASED',
          translations: [
            { locale: 'en', title: 'Pilot', original: true, overview: 'Hi' },
          ],
        },
      },
    ])

    expect(state.seasons).toHaveLength(1)
    const season = state.seasons[0]!
    expect(season.id).toBe(seasonId)
    expect(season.translations[0]!.title).toBe('First')
    expect(season.episodes).toHaveLength(1)
    expect(season.episodes[0]!.translations[0]).toMatchObject({
      title: 'Pilot',
      overview: 'Hi',
    })

    const changes = planStructureChanges(animeId, state, emptyStructureState())
    expect(changes).toHaveLength(2)
  })
})

describe('applyStructurePrefill on a new anime', () => {
  it('replays a withdrawn create so its seasons and episodes come back', () => {
    const state = emptyStructureState()
    const seasonId = UUID(10)

    applyStructurePrefill(state, [
      { entityKind: 'anime', entityId: UUID(9), op: 'create', payload: {} },
      {
        entityKind: 'animeSeason',
        entityId: seasonId,
        op: 'create',
        payload: {
          animeId: UUID(9),
          kind: 'SEASON',
          number: '3',
          translations: [{ locale: 'en', title: 'Third', original: true }],
        },
      },
      {
        entityKind: 'animeEpisode',
        entityId: UUID(11),
        op: 'create',
        payload: {
          animeId: null,
          seasonId,
          number: null,
          type: 'REGULAR',
          status: 'RELEASED',
          translations: [{ locale: 'en', title: 'Ep', original: true }],
        },
      },
    ])

    expect(state.seasons).toHaveLength(1)
    expect(state.seasons[0]!.number).toBe('3')
    expect(state.seasons[0]!.episodes).toHaveLength(1)

    expect(
      planStructureChanges(UUID(12), state, emptyStructureState()),
    ).toHaveLength(2)
  })
})

describe('structure diffing edge cases', () => {
  it('diffs an episode moved between seasons', () => {
    const moved = episode({ id: UUID(6) })
    const baseline: AnimeStructureState = {
      seasons: [
        season({ id: UUID(4), episodes: [moved] }),
        season({ id: UUID(5), episodes: [] }),
      ],
      episodes: [],
    }
    const next = clone(baseline)
    next.seasons[0]!.episodes = []
    next.seasons[1]!.episodes = [clone(moved)]

    const changes = planStructureChanges(ANIME, next, baseline)

    expect(changes).toEqual([
      {
        op: 'update',
        entityKind: 'animeEpisode',
        entityId: UUID(6),
        baseRev: 1,
        payload: expect.objectContaining({
          animeId: null,
          seasonId: UUID(5),
          position: 0,
        }),
      },
    ])
  })

  it('diffs an episode promoted from a season to the anime', () => {
    const promoted = episode({ id: UUID(6) })
    const baseline: AnimeStructureState = {
      seasons: [season({ id: UUID(4), episodes: [promoted] })],
      episodes: [],
    }
    const next: AnimeStructureState = {
      seasons: [{ ...clone(baseline.seasons[0]!), episodes: [] }],
      episodes: [clone(promoted)],
    }

    const [change] = planStructureChanges(ANIME, next, baseline)

    expect(change).toMatchObject({
      op: 'update',
      entityId: UUID(6),
      payload: { animeId: ANIME, seasonId: null, position: 1 },
    })
  })

  it('ignores key order when comparing documents', () => {
    const baseline: AnimeStructureState = {
      seasons: [],
      episodes: [
        episode({
          id: UUID(6),
          translations: [
            { locale: 'en', title: 'First', overview: null, original: true },
          ],
        }),
      ],
    }
    const next = clone(baseline)
    next.episodes[0]!.translations = [
      { original: true, overview: null, title: 'First', locale: 'en' },
    ]

    expect(planStructureChanges(ANIME, next, baseline)).toEqual([])
  })

  it('keeps a season position change from re-emitting its episodes', () => {
    const baseline: AnimeStructureState = {
      seasons: [
        season({ id: UUID(4), episodes: [episode({ id: UUID(6) })] }),
        season({ id: UUID(5), episodes: [] }),
      ],
      episodes: [],
    }
    const next = clone(baseline)
    next.seasons = [next.seasons[1]!, next.seasons[0]!]

    const changes = planStructureChanges(ANIME, next, baseline)

    expect(changes.map((change) => change.entityId).sort()).toEqual([
      UUID(4),
      UUID(5),
    ])
  })
})

describe('applyStructurePrefill translation handling', () => {
  it('keeps each overview on its own locale when a row is malformed', () => {
    const state = emptyStructureState()

    applyStructurePrefill(state, [
      {
        entityKind: 'animeEpisode',
        entityId: UUID(7),
        op: 'create',
        payload: {
          animeId: ANIME,
          seasonId: null,
          translations: [
            { locale: 'de', overview: 'Ohne Titel' },
            { locale: 'en', title: 'Pilot', original: true, overview: 'Hi' },
            { locale: 'ja-Jpan', title: 'パイロット', overview: null },
          ],
        },
      },
    ])

    expect(state.episodes[0]!.translations).toEqual([
      { locale: 'en', title: 'Pilot', original: true, overview: 'Hi' },
      {
        locale: 'ja-Jpan',
        title: 'パイロット',
        original: false,
        overview: null,
      },
    ])
  })

  it('drops rows whose locale is not a known localization locale', () => {
    const state = emptyStructureState()

    applyStructurePrefill(state, [
      {
        entityKind: 'animeEpisode',
        entityId: UUID(8),
        op: 'create',
        payload: {
          animeId: ANIME,
          seasonId: null,
          translations: [
            { locale: 'en', title: 'Pilot', original: true, overview: 'Hi' },
            { locale: 'ja', title: 'パイロット', overview: null },
          ],
        },
      },
    ])

    expect(state.episodes[0]!.translations).toEqual([
      { locale: 'en', title: 'Pilot', original: true, overview: 'Hi' },
    ])
  })
})

describe('preferredStructureTitle', () => {
  const en = {
    locale: 'en' as const,
    title: 'To You, in 2000 Years',
    original: false,
  }
  const ja = {
    locale: 'ja-Jpan' as const,
    title: '二千年後の君へ',
    original: true,
  }

  it('returns null without any translation', () => {
    expect(preferredStructureTitle([])).toBeNull()
  })

  it('prefers english over the original locale', () => {
    expect(preferredStructureTitle([ja, en])).toBe(en.title)
    expect(preferredStructureTitle([en, ja])).toBe(en.title)
  })

  it('falls back to the original locale without english', () => {
    expect(preferredStructureTitle([ja])).toBe(ja.title)
  })

  it('ignores a blank english title', () => {
    expect(preferredStructureTitle([{ ...en, title: '  ' }])).toBeNull()
  })
})
