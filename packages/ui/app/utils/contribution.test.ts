import type { ContributionDisplay } from '@hayasedb/contract'
import { describe, expect, it } from 'vitest'
import { change, UUID } from '../../test/contribution-fixtures'
import {
  buildChangesetTimeline,
  buildDiffRows,
  contributionEnumLabel,
  contributionFieldLabel,
  groupChanges,
  hiddenDiffFields,
  revisionDiffChange,
  type RevisionDiffSource,
  type TimelineChangeset,
} from './contribution'

describe('buildDiffRows', () => {
  it('lists every present field for a create in canonical order, including unchanged empties', () => {
    const rows = buildDiffRows(
      change({
        op: 'create',
        baseRev: null,
        payload: {
          translations: [{ locale: 'en', title: 'Bebop', original: true }],
          slug: 'bebop',
          genreIds: [],
          format: 'TV',
        },
      }),
    )
    expect(rows.map((r) => r.field)).toEqual([
      'slug',
      'format',
      'translations',
      'genreIds',
    ])
    expect(rows.find((r) => r.field === 'genreIds')).toMatchObject({
      before: null,
      after: [],
      changed: false,
      drifted: false,
    })
    expect(rows.find((r) => r.field === 'format')).toMatchObject({
      label: 'Format',
      changed: true,
    })
  })

  it('keeps only changed fields for an update and treats empty-ish values as equal', () => {
    const rows = buildDiffRows(
      change({
        payload: { slug: '', status: 'FINISHED', format: 'TV' },
        oldValues: { slug: null, status: 'RELEASING', format: 'TV' },
      }),
    )
    expect(rows.map((r) => r.field)).toEqual(['status'])
    expect(rows[0]).toMatchObject({
      before: 'RELEASING',
      after: 'FINISHED',
      drifted: false,
    })
  })

  it('compares unordered references and fuzzy dates by identity, not by serialization', () => {
    const rows = buildDiffRows(
      change({
        payload: {
          genreIds: [UUID(3), UUID(4)],
          startDate: '1998-04-03',
          endDate: { year: 1999, month: 4, day: null },
        },
        oldValues: {
          genreIds: [UUID(4), UUID(3)],
          startDate: { year: 1998, month: 4, day: 3 },
          endDate: { year: 1999, month: null, day: null },
        },
      }),
    )
    expect(rows.map((r) => r.field)).toEqual(['endDate'])
  })

  it('flags drift against the current head only for tracked fields', () => {
    const rows = buildDiffRows(
      change({
        payload: { status: 'FINISHED', slug: 'same' },
        oldValues: { status: 'RELEASING', slug: 'same' },
        currentValues: { status: 'CANCELLED', slug: 'same' },
        conflicted: true,
      }),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      field: 'status',
      currentValue: 'CANCELLED',
      drifted: true,
    })

    const untracked = buildDiffRows(
      change({
        payload: { status: 'FINISHED' },
        oldValues: { status: 'RELEASING' },
        currentValues: { slug: 'other' },
      }),
    )
    expect(untracked[0]?.drifted).toBe(false)
  })

  it('splits media into one row per type, ignores position for single items and labels the type', () => {
    const cover = { mediaId: UUID(9), type: 'COVER', position: 0 }
    const rows = buildDiffRows(
      change({
        payload: {
          media: [
            { ...cover, position: 5 },
            { mediaId: UUID(10), type: 'GALLERY', position: 0 },
            { mediaId: UUID(11), type: 'GALLERY', position: 1 },
          ],
        },
        oldValues: {
          media: [
            cover,
            { mediaId: UUID(11), type: 'GALLERY', position: 0 },
            { mediaId: UUID(10), type: 'GALLERY', position: 1 },
          ],
        },
      }),
    )
    expect(rows.map((r) => r.key)).toEqual(['media:GALLERY'])
    expect(rows[0]).toMatchObject({ field: 'media', label: 'Gallery' })
  })

  it('renders deletes from the old values with everything marked changed', () => {
    const rows = buildDiffRows(
      change({
        op: 'delete',
        entityKind: 'genre',
        payload: {},
        oldValues: { slug: 'drama' },
      }),
    )
    expect(rows).toEqual([
      expect.objectContaining({
        field: 'slug',
        label: 'Slug',
        before: null,
        after: 'drama',
        changed: true,
      }),
    ])
  })
})

describe('labels', () => {
  it('falls back to the raw key or value when no label exists', () => {
    expect(contributionFieldLabel('anime', 'translations')).toBe(
      'Localized content',
    )
    expect(contributionFieldLabel('genre', 'unknown')).toBe('unknown')
    expect(contributionEnumLabel('anime', 'format', 'TV')).toBe('TV')
    expect(contributionEnumLabel('anime', 'format', 'NOPE')).toBe('NOPE')
    expect(contributionEnumLabel('genre', 'slug', 42)).toBe('42')
  })
})

describe('buildChangesetTimeline', () => {
  const alice = { id: 'a', name: 'Alice', image: null }
  const mod = { id: 'm', name: 'Mod', image: null }
  const base: TimelineChangeset = {
    status: 'pending',
    author: alice,
    decidedBy: null,
    submittedAt: '2026-01-01T10:00:00Z',
    decidedAt: null,
    changeCount: 2,
    supersedesId: null,
    supersededById: null,
    revertsId: null,
    revertedBy: null,
    messages: [],
  }

  it('starts with the submission, typed by what it supersedes or reverts', () => {
    expect(buildChangesetTimeline(base)[0]).toMatchObject({
      type: 'submitted',
      variant: 'initial',
      targetId: null,
      changeCount: 2,
    })
    expect(
      buildChangesetTimeline({ ...base, supersedesId: 'old' })[0],
    ).toMatchObject({ variant: 'revision', targetId: 'old' })
    expect(
      buildChangesetTimeline({
        ...base,
        supersedesId: 'old',
        revertsId: 'r',
      })[0],
    ).toMatchObject({ variant: 'revert', targetId: 'r' })
    expect(buildChangesetTimeline({ ...base, submittedAt: null })).toEqual([])
  })

  it('orders entries by date and maps message kinds', () => {
    const entries = buildChangesetTimeline({
      ...base,
      messages: [
        {
          id: 'm2',
          author: mod,
          kind: 'system',
          body: 'conflict',
          createdAt: '2026-01-01T12:00:00Z',
        },
        {
          id: 'm1',
          author: alice,
          kind: 'comment',
          body: 'hi',
          createdAt: '2026-01-01T11:00:00Z',
        },
      ],
    })
    expect(entries.map((e) => [e.id, e.type])).toEqual([
      ['submitted', 'submitted'],
      ['m1', 'comment'],
      ['m2', 'system'],
    ])
  })

  it('emits a synthetic rejected entry only when no rejection message exists', () => {
    const decided = {
      ...base,
      status: 'rejected' as const,
      decidedBy: mod,
      decidedAt: '2026-01-02T00:00:00Z',
    }
    expect(buildChangesetTimeline(decided).at(-1)).toMatchObject({
      type: 'rejected',
      body: null,
      actor: mod,
    })
    const withMessage = buildChangesetTimeline({
      ...decided,
      messages: [
        {
          id: 'r',
          author: mod,
          kind: 'rejection',
          body: 'nope',
          createdAt: '2026-01-02T00:00:00Z',
        },
      ],
    })
    expect(withMessage.filter((e) => e.type === 'rejected')).toHaveLength(1)
    expect(withMessage.at(-1)).toMatchObject({ id: 'r', body: 'nope' })
  })

  it('attributes approval to the moderator but withdrawal and supersession to the author', () => {
    const at = '2026-01-02T00:00:00Z'
    expect(
      buildChangesetTimeline({
        ...base,
        status: 'approved',
        decidedBy: mod,
        decidedAt: at,
      }).at(-1),
    ).toMatchObject({ type: 'approved', actor: mod })
    expect(
      buildChangesetTimeline({
        ...base,
        status: 'approved',
        decidedAt: at,
      }).at(-1),
    ).toMatchObject({ type: 'approved', actor: { id: null } })
    expect(
      buildChangesetTimeline({
        ...base,
        status: 'withdrawn',
        decidedAt: at,
      }).at(-1),
    ).toMatchObject({ type: 'withdrawn', actor: alice })
    expect(
      buildChangesetTimeline({
        ...base,
        status: 'superseded',
        supersededById: 'next',
        decidedAt: at,
      }).at(-1),
    ).toMatchObject({ type: 'superseded', actor: alice, targetId: 'next' })
    expect(
      buildChangesetTimeline({
        ...base,
        status: 'superseded',
        decidedAt: at,
      }).filter((e) => e.type === 'superseded'),
    ).toEqual([])
  })

  it('appends the revert marker after the decision', () => {
    const entries = buildChangesetTimeline({
      ...base,
      status: 'approved',
      decidedBy: mod,
      decidedAt: '2026-01-02T00:00:00Z',
      revertedBy: { changesetId: 'rv', actor: mod, at: '2026-01-03T00:00:00Z' },
    })
    expect(entries.map((e) => e.type)).toEqual([
      'submitted',
      'approved',
      'reverted',
    ])
    expect(entries.at(-1)).toMatchObject({ targetId: 'rv' })
  })
})

describe('revisionDiffChange', () => {
  const source = (overrides: Partial<RevisionDiffSource> = {}) => ({
    id: UUID(1),
    entityId: UUID(2),
    entityKind: 'anime' as const,
    op: 'update' as const,
    rev: 3,
    changedFields: ['status'],
    snapshot: { slug: 'bebop', status: 'FINISHED' },
    previousSnapshot: { slug: 'bebop', status: 'RELEASING' },
    ...overrides,
  })

  it('narrows an update to the fields the revision actually moved', () => {
    const rows = buildDiffRows(revisionDiffChange(source()))
    expect(rows.map((row) => row.field)).toEqual(['status'])
    expect(rows[0]).toMatchObject({
      before: 'RELEASING',
      after: 'FINISHED',
      drifted: false,
    })
  })

  it('never reports drift, because an applied revision cannot drift', () => {
    const change = revisionDiffChange(source())
    expect(change.currentValues).toBeNull()
    expect(buildDiffRows(change).every((row) => !row.drifted)).toBe(true)
  })

  it('has no before column for the revision that created the entity', () => {
    const change = revisionDiffChange(
      source({
        op: 'create',
        rev: 1,
        changedFields: ['slug', 'status'],
        previousSnapshot: null,
      }),
    )
    expect(change.oldValues).toBeNull()
    expect(change.baseRev).toBeNull()
  })

  it('shows the whole prior document when the revision was a delete', () => {
    const change = revisionDiffChange(
      source({ op: 'delete', changedFields: ['deletedAt'] }),
    )
    expect(change.payload).toEqual({})

    expect(change.oldValues).toMatchObject({
      slug: 'bebop',
      status: 'RELEASING',
    })
  })
})

const display = (
  overrides: Partial<ContributionDisplay> = {},
): ContributionDisplay => ({
  refs: {},
  parents: {},
  contexts: {},
  mediaAssets: {},
  ...overrides,
})

describe('hiddenDiffFields', () => {
  it('hides only the parent links from a diff', () => {
    const season = change({ entityKind: 'animeSeason' })
    expect([...hiddenDiffFields(season)]).toEqual(['animeId'])

    const episode = change({ entityKind: 'animeEpisode' })
    expect([...hiddenDiffFields(episode)].sort()).toEqual([
      'animeId',
      'seasonId',
    ])
  })

  it('drops the hidden rows from the diff table', () => {
    const rows = buildDiffRows(
      change({
        entityKind: 'animeSeason',
        op: 'create',
        baseRev: null,
        payload: { animeId: UUID(9), kind: 'SEASON', number: '1' },
      }),
      hiddenDiffFields(change({ entityKind: 'animeSeason' })),
    )
    expect(rows.map((row) => row.field)).toEqual(['kind', 'number'])
  })
})

describe('groupChanges', () => {
  it('shows the anime for a changeset that only edits an episode', () => {
    const episode = change({
      id: UUID(1),
      entityKind: 'animeEpisode',
      entityId: UUID(2),
      payload: { durationSeconds: 1500 },
    })
    const groups = groupChanges(
      [episode],
      display({
        refs: { anime: { [UUID(3)]: 'Cowboy Bebop' } },
        parents: {
          [UUID(1)]: {
            animeId: UUID(3),
            seasonId: UUID(4),
            label: 'Episode 3',
          },
        },
      }),
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ title: 'Anime', anime: null })
    expect(groups[0]!.children.map((child) => child.title)).toEqual(['Episode'])
  })

  it('survives a display payload that carries no parents map', () => {
    const episode = change({ entityKind: 'animeEpisode' })
    const stale = {
      refs: {},
      mediaAssets: {},
    } as unknown as ContributionDisplay

    expect(() => groupChanges([episode], stale)).not.toThrow()
    expect(groupChanges([episode], stale)).toHaveLength(1)
  })

  it('nests an episode under the season it belongs to', () => {
    const season = change({
      id: UUID(1),
      entityKind: 'animeSeason',
      entityId: UUID(5),
    })
    const episode = change({
      id: UUID(2),
      entityKind: 'animeEpisode',
      entityId: UUID(6),
    })
    const groups = groupChanges(
      [season, episode],
      display({
        refs: { anime: { [UUID(3)]: 'Bebop' } },
        parents: {
          [UUID(1)]: { animeId: UUID(3), seasonId: null, label: 'Season 1' },
          [UUID(2)]: {
            animeId: UUID(3),
            seasonId: UUID(5),
            label: 'Episode 3',
          },
        },
      }),
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]!.children.map((child) => child.change?.id)).toEqual([
      UUID(1),
    ])
    expect(groups[0]!.children[0]!.episodes.map((e) => e.change?.id)).toEqual([
      UUID(2),
    ])
  })

  it('nests an episode that arrives before its season', () => {
    const season = change({
      id: UUID(1),
      entityKind: 'animeSeason',
      entityId: UUID(5),
    })
    const episode = change({
      id: UUID(2),
      entityKind: 'animeEpisode',
      entityId: UUID(6),
    })
    const groups = groupChanges(
      [episode, season],
      display({
        parents: {
          [UUID(1)]: { animeId: UUID(3), seasonId: null, label: 'Season 1' },
          [UUID(2)]: {
            animeId: UUID(3),
            seasonId: UUID(5),
            label: 'Episode 3',
          },
        },
      }),
    )

    expect(groups[0]!.children.map((child) => child.change?.id)).toEqual([
      UUID(1),
    ])
    expect(groups[0]!.children[0]!.episodes.map((e) => e.change?.id)).toEqual([
      UUID(2),
    ])
  })

  it('nests an episode under a season that is only context', () => {
    const episode = change({
      id: UUID(2),
      entityKind: 'animeEpisode',
      entityId: UUID(6),
    })
    const groups = groupChanges(
      [episode],
      display({
        refs: { animeSeason: { [UUID(5)]: 'Season One' } },
        contexts: { [UUID(5)]: { kind: 'SEASON', number: '1' } },
        parents: {
          [UUID(2)]: {
            animeId: UUID(3),
            seasonId: UUID(5),
            label: 'Episode 3',
          },
        },
      }),
    )

    expect(groups[0]!.children).toHaveLength(1)
    const season = groups[0]!.children[0]!
    expect(season.change).toBeNull()
    expect(season.title).toBe('Season')
    expect(season.context).toEqual({ kind: 'SEASON', number: '1' })
    expect(
      buildContextRows('animeSeason', { number: '1.000' }).map(
        (row) => row.value,
      ),
    ).toEqual(['1'])
    expect(season.episodes.map((e) => e.change?.id)).toEqual([UUID(2)])
  })

  it('keeps an episode at anime level when its season is not in the changeset', () => {
    const episode = change({
      id: UUID(2),
      entityKind: 'animeEpisode',
      entityId: UUID(6),
    })
    const groups = groupChanges(
      [episode],
      display({
        parents: {
          [UUID(2)]: {
            animeId: UUID(3),
            seasonId: UUID(5),
            label: 'Episode 3',
          },
        },
      }),
    )

    expect(groups[0]!.children).toHaveLength(1)
    expect(groups[0]!.children[0]!.episodes).toEqual([])
  })

  it('files the anime and its children under one group', () => {
    const anime = change({ id: UUID(1), entityId: UUID(3) })
    const season = change({
      id: UUID(2),
      entityKind: 'animeSeason',
      entityId: UUID(5),
    })
    const groups = groupChanges(
      [anime, season],
      display({
        refs: { anime: { [UUID(3)]: 'Bebop' } },
        parents: {
          [UUID(1)]: { animeId: UUID(3), seasonId: null, label: null },
          [UUID(2)]: { animeId: UUID(3), seasonId: null, label: 'Season 1' },
        },
      }),
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]!.anime).toBe(anime)
    expect(groups[0]!.children).toHaveLength(1)
  })
})
