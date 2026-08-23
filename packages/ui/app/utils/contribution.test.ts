import { describe, expect, it } from 'vitest'
import { change, UUID } from '../../test/contribution-fixtures'
import {
  buildChangesetTimeline,
  buildDiffRows,
  contributionEnumLabel,
  contributionFieldLabel,
  type TimelineChangeset,
} from './contribution'

describe('buildDiffRows', () => {
  it('lists every present field for a create in canonical order, including unchanged empties', () => {
    const rows = buildDiffRows(
      change({
        op: 'create',
        baseRev: null,
        payload: {
          titleEnglish: 'Bebop',
          slug: 'bebop',
          genreIds: [],
          format: 'TV',
        },
      }),
    )
    expect(rows.map((r) => r.field)).toEqual([
      'slug',
      'format',
      'titleEnglish',
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
        payload: { titleRomaji: '', titleEnglish: 'New', description: 'x' },
        oldValues: { titleRomaji: null, titleEnglish: 'Old', description: 'x' },
      }),
    )
    expect(rows.map((r) => r.field)).toEqual(['titleEnglish'])
    expect(rows[0]).toMatchObject({
      before: 'Old',
      after: 'New',
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
        payload: { titleEnglish: 'Mine', slug: 'same' },
        oldValues: { titleEnglish: 'Base', slug: 'same' },
        currentValues: { titleEnglish: 'Someone else', slug: 'same' },
        conflicted: true,
      }),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      field: 'titleEnglish',
      currentValue: 'Someone else',
      drifted: true,
    })

    const untracked = buildDiffRows(
      change({
        payload: { titleEnglish: 'Mine' },
        oldValues: { titleEnglish: 'Base' },
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
        oldValues: { name: 'Drama' },
      }),
    )
    expect(rows).toEqual([
      expect.objectContaining({
        field: 'name',
        label: 'Name',
        before: null,
        after: 'Drama',
        changed: true,
      }),
    ])
  })
})

describe('labels', () => {
  it('falls back to the raw key or value when no label exists', () => {
    expect(contributionFieldLabel('anime', 'titleNative')).toBe('Native title')
    expect(contributionFieldLabel('genre', 'unknown')).toBe('unknown')
    expect(contributionEnumLabel('anime', 'format', 'TV')).toBe('TV')
    expect(contributionEnumLabel('anime', 'format', 'NOPE')).toBe('NOPE')
    expect(contributionEnumLabel('genre', 'name', 42)).toBe('42')
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
