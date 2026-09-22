import { describe, expect, it } from 'vitest'
import { UUID } from '../../test/contribution-fixtures'
import {
  buildRevisionGraph,
  DOT_GAP,
  DOT_HALO_RADIUS,
  DOT_RADIUS,
  gutterWidthFor,
  HOLLOW_DOT_RADIUS,
  LANE_ORIGIN,
  LANE_WIDTH,
  laneX,
  NODE_BOTTOM,
  NODE_TOP,
  NODE_Y,
  RAIL_WIDTH,
  ROW_HEAD_HEIGHT,
  TRUNK_KEY,
  type RevisionGraphBranch,
  type RevisionGraphInput,
  type RevisionGraphRevision,
  type RevisionGraphRow,
} from './revisionGraph'

const actor = (name: string | null = 'Alice') => ({
  id: UUID(9),
  name,
  image: null,
})

function revision(
  overrides: Partial<RevisionGraphRevision> = {},
): RevisionGraphRevision {
  return {
    id: UUID(overrides.rev ?? 1),
    rev: 1,
    op: 'update',
    changedFields: ['slug'],
    editor: actor(),
    changesetId: null,
    changesetSummary: 'Tidy the slug',
    createdAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  }
}

function branch(
  overrides: Partial<RevisionGraphBranch> = {},
): RevisionGraphBranch {
  return {
    id: UUID(80),
    status: 'pending',
    summary: 'Add the 2026 season',
    author: actor('Mika'),
    changeCount: 2,
    baseRev: 2,
    submittedAt: '2026-08-02T10:00:00.000Z',
    createdAt: '2026-08-02T09:00:00.000Z',
    ...overrides,
  }
}

const build = (input: Omit<RevisionGraphInput, 'entityKind'>) =>
  buildRevisionGraph({ entityKind: 'anime', ...input }).rows

const graph = (input: Omit<RevisionGraphInput, 'entityKind'>) =>
  buildRevisionGraph({ entityKind: 'anime', ...input })

const railAt = (row: RevisionGraphRow, laneIndex: number) =>
  [...row.headRails, ...row.tailRails].find(
    (rail) => rail.laneIndex === laneIndex,
  )

const at = (rows: RevisionGraphRow[], rev: number) =>
  rows.find((row) => row.type === 'revision' && row.rev === rev)!

describe('buildRevisionGraph', () => {
  it('returns nothing for an empty history', () => {
    const result = graph({ revisions: [] })
    expect(result.rows).toEqual([])
    expect(result.laneCount).toBe(1)
    expect(result.gutterWidth).toBe(gutterWidthFor(1))
  })

  it('paints a continuous rail across a three-revision trunk', () => {
    const rows = build({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })
    expect(rows.map((row) => row.segment)).toEqual(['first', 'middle', 'last'])
    expect(rows.every((row) => row.lane === 'trunk')).toBe(true)
  })

  it('marks a lone revision as a standalone node', () => {
    const rows = build({ revisions: [revision({ rev: 1, op: 'create' })] })
    expect(rows[0]).toMatchObject({
      segment: 'only',
      dot: 'head',
      color: 'success',
      title: 'created',
    })
  })

  it('keeps the rail open when earlier revisions exist beyond the page', () => {
    const rows = build({
      revisions: [revision({ rev: 9 }), revision({ rev: 8 })],
      hasEarlier: true,
    })
    expect(rows.map((row) => row.segment)).toEqual(['first', 'middle'])
  })

  it('normalises revisions supplied out of order', () => {
    const rows = build({
      revisions: [
        revision({ rev: 1 }),
        revision({ rev: 3 }),
        revision({ rev: 2 }),
      ],
    })
    expect(rows.map((row) => row.type === 'revision' && row.rev)).toEqual([
      3, 2, 1,
    ])
  })

  it('treats the highest revision as head when headRev is absent', () => {
    const rows = build({
      revisions: [revision({ rev: 4 }), revision({ rev: 3 })],
    })
    expect(rows[0]).toMatchObject({ dot: 'head' })
    expect(rows[0]!.type === 'revision' && rows[0]!.canRevert).toBe(false)
    expect(rows[1]!.type === 'revision' && rows[1]!.canRevert).toBe(true)
  })

  it('defers to headRev when the page does not contain the tip', () => {
    const rows = build({
      revisions: [revision({ rev: 4 }), revision({ rev: 3 })],
      headRev: 7,
    })
    expect(rows.every((row) => row.dot === 'solid')).toBe(true)
    expect(rows.every((row) => row.type === 'revision' && row.canRevert)).toBe(
      true,
    )
  })

  it('colours a revert by its intent rather than its operation', () => {
    const rows = build({
      revisions: [revision({ rev: 5, op: 'update', revertsRev: 2 })],
    })
    expect(rows[0]).toMatchObject({
      color: 'warning',
      icon: 'i-lucide-undo-2',
      title: 'reverted to r2',
    })
  })

  it('pluralises the changed-field count', () => {
    const one = build({ revisions: [revision({ changedFields: ['slug'] })] })
    const many = build({
      revisions: [revision({ changedFields: ['slug', 'format', 'status'] })],
    })
    expect(one[0]!.title).toBe('updated 1 field')
    expect(many[0]!.title).toBe('updated 3 fields')
  })

  it('truncates field labels for display while retaining the full list', () => {
    const fields = ['slug', 'format', 'status', 'startDate', 'endDate']
    const rows = build({
      revisions: [revision({ changedFields: fields })],
      maxFieldLabels: 2,
    })
    const row = rows[0]!
    expect(row.type === 'revision' && row.fieldLabels).toHaveLength(2)
    expect(row.type === 'revision' && row.hiddenFieldLabels).toHaveLength(3)
    expect(row.type === 'revision' && row.changedFields).toEqual(fields)
  })

  it('lists open contributions above the trunk, newest first', () => {
    const rows = build({
      revisions: [revision({ rev: 2 })],
      openChangesets: [
        branch({ id: UUID(81), submittedAt: '2026-08-01T00:00:00.000Z' }),
        branch({ id: UUID(82), submittedAt: '2026-08-05T00:00:00.000Z' }),
      ],
    })
    expect(rows.map((row) => row.type)).toEqual([
      'branch',
      'branch',
      'revision',
    ])
    expect(rows[0]!.id).toBe(UUID(82))
    expect(rows[0]).toMatchObject({ lane: 'branch', dot: 'hollow' })
  })

  it('forks a submission at the revision it was based on', () => {
    const rows = build({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2 }),
        revision({ rev: 1 }),
      ],
      openChangesets: [branch({ baseRev: 2 })],
    })

    expect(railAt(at(rows, 3), 1)).toMatchObject({
      kind: 'through',
      x: laneX(1),
    })
    expect(at(rows, 3).connectors).toEqual([])

    expect(railAt(at(rows, 2), 1)).toBeUndefined()
    expect(at(rows, 2).connectors).toMatchObject([
      { kind: 'fork', fromLane: 1, toLane: 0, color: 'neutral' },
    ])

    expect(at(rows, 1).headRails.map((rail) => rail.laneIndex)).toEqual([0])
    expect(at(rows, 1).connectors).toEqual([])
  })

  it('meets the fork curve exactly where the lane above ends', () => {
    const rows = build({
      revisions: [revision({ rev: 2 }), revision({ rev: 1 })],
      openChangesets: [branch({ baseRev: 1 })],
    })
    const above = railAt(at(rows, 2), 1)!
    const [connector] = at(rows, 1).connectors

    expect(connector!.path.startsWith(`M${above.x},0`)).toBe(true)
    expect(connector!.path.endsWith(`${laneX(0)},${NODE_TOP}`)).toBe(true)
  })

  it('never emits a rail whose x disagrees with its lane', () => {
    const rows = build({
      revisions: [
        revision({ rev: 3, changesetId: UUID(60), baseRev: 2 }),
        revision({ rev: 2 }),
        revision({ rev: 1, op: 'create' }),
      ],
      openChangesets: [branch({ baseRev: 2 })],
    })
    for (const row of rows) {
      expect(row.dotX).toBe(laneX(row.laneIndex))
      for (const rail of [...row.headRails, ...row.tailRails]) {
        expect(rail.x).toBe(laneX(rail.laneIndex))
      }
    }
  })

  it('draws a revision from a changeset as a merged branch', () => {
    const rows = build({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2, changesetId: UUID(60), baseRev: 1 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })

    expect(at(rows, 2)).toMatchObject({
      merged: true,
      laneIndex: 0,
      dotX: laneX(0),
    })

    expect(at(rows, 2).connectors).toMatchObject([
      { kind: 'merge', fromLane: 1, toLane: 0 },
    ])
    expect(at(rows, 2).tailRails.some((rail) => rail.laneIndex === 1)).toBe(
      true,
    )
    expect(at(rows, 2).headRails.some((rail) => rail.laneIndex === 1)).toBe(
      false,
    )
    expect(railAt(at(rows, 2), 0)).toMatchObject({ kind: 'through' })

    expect(at(rows, 1).connectors).toMatchObject([
      { kind: 'fork', fromLane: 1, toLane: 0 },
    ])
  })

  it('draws every connector inside its own row, touching no free edge', () => {
    const rows = build({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2, changesetId: UUID(60), baseRev: 1 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })

    const points = (path: string) =>
      path
        .replace(/^M/, '')
        .split('C')
        .map((part) => part.trim().split(/[ ,]+/).slice(-2).map(Number))

    const merge = at(rows, 2).connectors[0]!
    expect(merge.kind).toBe('merge')

    expect(points(merge.path)[0]).toEqual([laneX(0), NODE_BOTTOM])
    expect(points(merge.path).at(-1)).toEqual([laneX(1), ROW_HEAD_HEIGHT])

    const fork = at(rows, 1).connectors[0]!
    expect(fork.kind).toBe('fork')

    expect(points(fork.path)[0]).toEqual([laneX(1), 0])
    expect(points(fork.path).at(-1)).toEqual([laneX(0), NODE_TOP])
  })

  it('clears the node halo by the same distance above and below', () => {
    expect(NODE_TOP).toBe(NODE_Y - DOT_HALO_RADIUS)
    expect(NODE_BOTTOM).toBe(NODE_Y + DOT_HALO_RADIUS)
    expect(DOT_HALO_RADIUS).toBe(DOT_RADIUS + DOT_GAP)
    expect(NODE_TOP - 0).toBe(ROW_HEAD_HEIGHT - NODE_BOTTOM)
  })

  it('leaves the same gap around every dot variant', () => {
    const solidEdge = DOT_RADIUS
    const hollowEdge = HOLLOW_DOT_RADIUS + RAIL_WIDTH / 2
    expect(hollowEdge).toBe(solidEdge)
    expect(DOT_HALO_RADIUS - solidEdge).toBe(DOT_GAP)
    expect(DOT_HALO_RADIUS - hollowEdge).toBe(DOT_GAP)
  })

  it('gives a merge commit and its branch a single shared identity', () => {
    const rows = build({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2, changesetId: UUID(60), baseRev: 1 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })

    const mergeRow = at(rows, 2)
    const branchKey = mergeRow.branchKey
    expect(branchKey).not.toBeNull()

    expect(mergeRow.connectors[0]!.branchKey).toBe(branchKey)
    expect(railAt(mergeRow, 1)!.branchKey).toBe(branchKey)
    expect(at(rows, 1).connectors[0]!.branchKey).toBe(branchKey)

    expect(railAt(mergeRow, 1)!.color).toBe('neutral')
    expect(railAt(mergeRow, 0)!.color).toBe('neutral')

    expect(railAt(mergeRow, 0)!.branchKey).toBe(TRUNK_KEY)
    expect(at(rows, 3).branchKey).toBe(TRUNK_KEY)
    expect(branchKey).not.toBe(TRUNK_KEY)
  })

  it('keeps the trunk unbroken across every row of a plain history', () => {
    const rows = build({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })
    expect(rows.map((row) => railAt(row, 0)!.kind)).toEqual([
      'bottom',
      'through',
      'top',
    ])

    expect(rows.map((row) => row.tailRails.map((rail) => rail.kind))).toEqual([
      ['through'],
      ['through'],
      [],
    ])
  })

  it('leaves a direct admin edit on the trunk with no branch', () => {
    const rows = build({
      revisions: [revision({ rev: 2 }), revision({ rev: 1, op: 'create' })],
    })
    expect(
      rows.every(
        (row) => row.type === 'revision' && !row.merged && row.lane === 'trunk',
      ),
    ).toBe(true)
    expect(rows.every((row) => row.connectors.length === 0)).toBe(true)
  })

  it('leaves no straight rail under a merge curve', () => {
    const rows = build({
      revisions: [
        revision({ rev: 3 }),
        revision({ rev: 2, changesetId: UUID(60), baseRev: 1 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })
    const mergeRow = at(rows, 2)
    const branchKey = mergeRow.connectors[0]!.branchKey

    expect(
      mergeRow.headRails.filter((rail) => rail.branchKey === branchKey),
    ).toEqual([])

    expect(
      mergeRow.tailRails.some((rail) => rail.branchKey === branchKey),
    ).toBe(true)
  })

  it('keeps back-to-back contributions all on the first branch lane', () => {
    const result = graph({
      revisions: [
        revision({ rev: 4, changesetId: UUID(60), baseRev: 3 }),
        revision({ rev: 3, changesetId: UUID(61), baseRev: 2 }),
        revision({ rev: 2, changesetId: UUID(62), baseRev: 1 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })

    expect(result.laneCount).toBe(2)
    expect(
      result.rows.flatMap((row) =>
        row.connectors.map((connector) => connector.fromLane),
      ),
    ).toEqual([1, 1, 1, 1, 1, 1])
  })

  it('reuses a lane once a merged branch has rejoined the trunk', () => {
    const rows = build({
      revisions: [
        revision({ rev: 4, changesetId: UUID(60), baseRev: 3 }),
        revision({ rev: 3 }),
        revision({ rev: 2, changesetId: UUID(61), baseRev: 1 }),
        revision({ rev: 1, op: 'create' }),
      ],
    })
    const merged = rows.filter((row) => row.type === 'revision' && row.merged)
    expect(merged.map((row) => row.type === 'revision' && row.rev)).toEqual([
      4, 2,
    ])

    expect(
      merged.map((row) => row.type === 'revision' && row.laneIndex),
    ).toEqual([0, 0])
    expect(
      merged.flatMap((row) =>
        row.connectors
          .filter((connector) => connector.kind === 'merge')
          .map((connector) => connector.fromLane),
      ),
    ).toEqual([1, 1])
  })

  it('gives overlapping branches their own parallel lanes', () => {
    const rows = build({
      revisions: [revision({ rev: 3 }), revision({ rev: 2 })],
      openChangesets: [
        branch({
          id: UUID(81),
          baseRev: 2,
          submittedAt: '2026-08-05T00:00:00.000Z',
        }),
        branch({
          id: UUID(82),
          baseRev: 2,
          submittedAt: '2026-08-04T00:00:00.000Z',
        }),
      ],
    })
    const branchRows = rows.filter((row) => row.type === 'branch')
    expect(branchRows.map((row) => row.laneIndex)).toEqual([1, 2])
    expect(branchRows.map((row) => row.dotX)).toEqual([laneX(1), laneX(2)])

    const r2 = at(rows, 2)
    expect(r2.connectors.map((c) => c.fromLane)).toEqual([1, 2])
    expect(r2.connectors.map((c) => c.toLane)).toEqual([0, 0])
    expect(r2.connectors.map((c) => c.color)).toEqual(['neutral', 'neutral'])
    expect(new Set(r2.connectors.map((c) => c.branchKey)).size).toBe(2)
    expect(new Set(r2.connectors.map((c) => c.path)).size).toBe(2)
  })

  it('reserves a gutter wide enough for every lane in play', () => {
    const one = graph({ revisions: [revision({ rev: 1 })] })
    expect(one.laneCount).toBe(1)
    expect(one.gutterWidth).toBe(LANE_ORIGIN * 2)

    const three = graph({
      revisions: [revision({ rev: 2 }), revision({ rev: 1 })],
      openChangesets: [
        branch({ id: UUID(81), baseRev: 1 }),
        branch({ id: UUID(82), baseRev: 1 }),
      ],
    })
    expect(three.laneCount).toBe(3)
    expect(three.gutterWidth).toBe(LANE_ORIGIN * 2 + LANE_WIDTH * 2)
  })

  it('runs a branch the full height when its fork point is off the page', () => {
    const rows = build({
      revisions: [revision({ rev: 9 }), revision({ rev: 8 })],
      hasEarlier: true,
      openChangesets: [branch({ baseRev: 4 })],
    })
    expect(rows[0]).toMatchObject({ type: 'branch', detached: true })
    expect(rows.every((row) => row.connectors.length === 0)).toBe(true)

    expect(
      rows.every(
        (row) =>
          row.type !== 'revision' ||
          railAt(row, 1)?.kind === 'through' ||
          row.rev === 8,
      ),
    ).toBe(true)
    expect(railAt(at(rows, 8), 1)).toMatchObject({ kind: 'through' })
  })

  it('treats a submission that creates the entity as detached', () => {
    const rows = build({
      revisions: [],
      openChangesets: [branch({ baseRev: null })],
    })
    expect(rows[0]).toMatchObject({ detached: true, laneIndex: 1 })
  })

  it('falls back to creation time for a contribution never submitted', () => {
    const rows = build({
      revisions: [],
      openChangesets: [branch({ status: 'draft', submittedAt: null })],
    })
    expect(rows[0]).toMatchObject({
      date: '2026-08-02T09:00:00.000Z',
      color: 'neutral',
      title: 'draft',
    })
  })

  it('gives every dot a spoken label so colour is never the only channel', () => {
    const rows = build({
      revisions: [revision({ rev: 2, op: 'delete' })],
      openChangesets: [branch()],
    })
    expect(rows.every((row) => row.dotLabel.length > 0)).toBe(true)
  })
})
