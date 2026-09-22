import type { ChangeOp, ChangesetStatus, EntityKind } from '@hayasedb/domain'
import {
  contributionFieldLabel,
  type TimelineActor,
  type TimelineDate,
} from './contribution'

export const LANE_WIDTH = 18
export const LANE_ORIGIN = 11
export const DOT_RADIUS = 5
export const RAIL_WIDTH = 2
export const ROW_HEAD_HEIGHT = 44
export const NODE_Y = ROW_HEAD_HEIGHT / 2
export const DOT_GAP = 2
export const HOLLOW_DOT_RADIUS = DOT_RADIUS - RAIL_WIDTH / 2
export const DOT_HALO_RADIUS = DOT_RADIUS + DOT_GAP
export const NODE_TOP = NODE_Y - DOT_HALO_RADIUS
export const NODE_BOTTOM = NODE_Y + DOT_HALO_RADIUS

export const laneX = (laneIndex: number): number =>
  LANE_ORIGIN + laneIndex * LANE_WIDTH

export const gutterWidthFor = (laneCount: number): number =>
  laneX(Math.max(laneCount, 1) - 1) + LANE_ORIGIN

type RevisionGraphLane = 'trunk' | 'branch'
type RevisionRailSegment = 'first' | 'middle' | 'last' | 'only'
type RevisionDotVariant = 'solid' | 'hollow' | 'head'
export type RevisionGraphColor =
  'success' | 'primary' | 'error' | 'warning' | 'neutral'
export type RevisionRailKind = 'through' | 'top' | 'bottom'

export interface RevisionRail {
  key: string
  kind: RevisionRailKind
  laneIndex: number
  branchKey: string
  x: number
  color: RevisionGraphColor
  dashed: boolean
  tailOnly?: boolean
}

export type RevisionConnectorKind = 'fork' | 'merge'

export interface RevisionConnector {
  key: string
  kind: RevisionConnectorKind
  branchKey: string
  fromLane: number
  toLane: number
  color: RevisionGraphColor
  dashed: boolean
  path: string
}

export interface RevisionGraphRevision {
  id: string
  rev: number
  op: ChangeOp
  changedFields: string[]
  editor: TimelineActor | null
  changesetId: string | null
  changesetSummary: string | null
  baseRev?: number | null
  createdAt: TimelineDate
  revertsRev?: number | null
}

export interface RevisionGraphBranch {
  id: string
  status: ChangesetStatus
  summary: string
  author: TimelineActor
  changeCount: number
  baseRev: number | null
  submittedAt: TimelineDate | null
  createdAt: TimelineDate
}

interface RevisionGraphRowBase {
  id: string
  lane: RevisionGraphLane
  segment: RevisionRailSegment
  dot: RevisionDotVariant
  color: RevisionGraphColor
  icon: string | undefined
  dotLabel: string
  title: string
  summary: string | null
  actor: TimelineActor | null
  date: TimelineDate
  branchKey: string
  highlightKey: string | null
  laneIndex: number
  dotX: number
  headRails: RevisionRail[]
  tailRails: RevisionRail[]
  connectors: RevisionConnector[]
}

export type RevisionGraphRow =
  | (RevisionGraphRowBase & {
      type: 'revision'
      rev: number
      op: ChangeOp
      isHead: boolean
      revertsRev: number | null
      changesetId: string | null
      changedFields: string[]
      fieldLabels: string[]
      hiddenFieldLabels: string[]
      canRevert: boolean
      merged: boolean
    })
  | (RevisionGraphRowBase & {
      type: 'branch'
      changesetId: string
      status: ChangesetStatus
      changeCount: number
      baseRev: number | null
      detached: boolean
    })

export interface RevisionGraph {
  rows: RevisionGraphRow[]
  laneCount: number
  gutterWidth: number
}

export interface RevisionGraphInput {
  revisions: readonly RevisionGraphRevision[]
  entityKind: EntityKind
  openChangesets?: readonly RevisionGraphBranch[]
  headRev?: number
  hasEarlier?: boolean
  maxFieldLabels?: number
}

export const TRUNK_KEY = 'trunk'

const DEFAULT_MAX_FIELD_LABELS = 4

const LANE_COLOR: RevisionGraphColor = 'neutral'

const OP_COLORS: Record<ChangeOp, RevisionGraphColor> = {
  create: 'success',
  update: 'primary',
  delete: 'error',
}

const OP_ICONS: Record<ChangeOp, string | undefined> = {
  create: undefined,
  update: undefined,
  delete: 'i-lucide-x',
}

const time = (value: TimelineDate) => new Date(value).getTime()

export const CONNECTOR_TENSION = 0.75

function bendPath(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
): string {
  const d = (toY - fromY) * CONNECTOR_TENSION
  return `M${fromX},${fromY}C${fromX},${fromY + d} ${toX},${toY - d} ${toX},${toY}`
}

function connectorPath(
  kind: RevisionConnectorKind,
  fromX: number,
  toX: number,
) {
  return kind === 'fork'
    ? bendPath(fromX, 0, toX, NODE_TOP)
    : bendPath(toX, NODE_BOTTOM, fromX, ROW_HEAD_HEIGHT)
}

function makeConnector(
  key: string,
  kind: RevisionConnectorKind,
  branchKey: string,
  fromLane: number,
  toLane: number,
  color: RevisionGraphColor,
  dashed: boolean,
): RevisionConnector {
  return {
    key,
    kind,
    branchKey,
    fromLane,
    toLane,
    color,
    dashed,
    path: connectorPath(kind, laneX(fromLane), laneX(toLane)),
  }
}

function revisionTitle(
  op: ChangeOp,
  changedFields: string[],
  revertsRev: number | null,
): string {
  if (revertsRev !== null) return `reverted to r${revertsRev}`
  if (op === 'create') return 'created'
  if (op === 'delete') return 'deleted'
  const count = changedFields.length
  if (count === 0) return 'updated'
  return `updated ${count} ${count === 1 ? 'field' : 'fields'}`
}

function segmentAt(
  index: number,
  length: number,
  hasEarlier: boolean,
): RevisionRailSegment {
  const isLast = index === length - 1
  if (isLast && hasEarlier) return index === 0 ? 'first' : 'middle'
  if (length === 1) return 'only'
  if (index === 0) return 'first'
  if (isLast) return 'last'
  return 'middle'
}

interface LaneSpan {
  key: string
  topRev: number
  forkRev: number
  color: RevisionGraphColor
  draft: boolean
  laneIndex: number
}

function allocateSpans(spans: LaneSpan[]): void {
  const occupiedDownTo: number[] = []
  for (const span of [...spans].sort((a, b) => b.topRev - a.topRev)) {
    let index = occupiedDownTo.findIndex((forkRev) => forkRev >= span.topRev)
    if (index === -1) index = occupiedDownTo.length
    occupiedDownTo[index] = span.forkRev
    span.laneIndex = index + 1
  }
}

export function buildRevisionGraph(input: RevisionGraphInput): RevisionGraph {
  const {
    entityKind,
    hasEarlier = false,
    maxFieldLabels = DEFAULT_MAX_FIELD_LABELS,
  } = input
  const revisions = [...input.revisions].sort((a, b) => b.rev - a.rev)
  const head =
    input.headRev ??
    (revisions.length > 0 ? Math.max(...revisions.map((r) => r.rev)) : 0)
  const lowestRev =
    revisions.length > 0 ? Math.min(...revisions.map((r) => r.rev)) : 0
  const highestRev =
    revisions.length > 0 ? Math.max(...revisions.map((r) => r.rev)) : 0
  const onPage = new Set(revisions.map((revision) => revision.rev))
  const openBranches = [...(input.openChangesets ?? [])].sort(
    (a, b) =>
      time(b.submittedAt ?? b.createdAt) - time(a.submittedAt ?? a.createdAt),
  )
  const mergedRevisions = revisions.filter(
    (revision) => revision.changesetId !== null && revision.rev > lowestRev,
  )
  const spans: LaneSpan[] = [
    ...openBranches.map((branch) => ({
      key: `open:${branch.id}`,
      topRev: highestRev + 1,
      forkRev:
        branch.baseRev !== null && onPage.has(branch.baseRev)
          ? branch.baseRev
          : lowestRev - 1,
      color: 'neutral' as RevisionGraphColor,
      draft: branch.status === 'draft',
      laneIndex: 1,
    })),
    ...mergedRevisions.map((revision) => ({
      key: `merged:${revision.id}`,
      topRev: revision.rev,
      forkRev: revision.baseRev ?? revision.rev - 1,
      color: 'neutral' as RevisionGraphColor,
      draft: false,
      laneIndex: 1,
    })),
  ]

  allocateSpans(spans)
  for (const span of spans) {
    span.color = LANE_COLOR
  }

  const spanByKey = new Map(spans.map((span) => [span.key, span]))
  const laneCount = spans.reduce(
    (widest, span) => Math.max(widest, span.laneIndex + 1),
    1,
  )

  const rows: RevisionGraphRow[] = []

  const tailOf = (rails: RevisionRail[]): RevisionRail[] =>
    rails
      .filter((rail) => rail.kind !== 'top')
      .map((rail) => ({
        ...rail,
        key: `tail-${rail.key}`,
        kind: 'through' as const,
        tailOnly: false,
      }))

  openBranches.forEach((branch, index) => {
    const span = spanByKey.get(`open:${branch.id}`)!
    const isDraft = branch.status === 'draft'
    const rails: RevisionRail[] = [
      {
        key: `rail-self-${branch.id}`,
        kind: 'bottom',
        branchKey: span.key,
        laneIndex: span.laneIndex,
        x: laneX(span.laneIndex),
        color: span.color,
        dashed: span.draft,
      },
    ]

    if (revisions.length > 0) {
      rails.push({
        key: 'rail-trunk',
        kind: 'through',
        branchKey: TRUNK_KEY,
        laneIndex: 0,
        x: laneX(0),
        color: 'neutral',
        dashed: false,
      })
    }

    openBranches.forEach((other, otherIndex) => {
      if (otherIndex >= index) return
      const otherSpan = spanByKey.get(`open:${other.id}`)!
      rails.push({
        key: `rail-open-${other.id}`,
        kind: 'through',
        branchKey: otherSpan.key,
        laneIndex: otherSpan.laneIndex,
        x: laneX(otherSpan.laneIndex),
        color: otherSpan.color,
        dashed: otherSpan.draft,
      })
    })

    rows.push({
      type: 'branch',
      id: branch.id,
      changesetId: branch.id,
      lane: 'branch',
      segment: 'only',
      dot: 'hollow',
      color: span.color,
      icon: undefined,
      dotLabel: isDraft ? 'Draft contribution' : 'Open contribution',
      title: isDraft ? 'draft' : 'pending review',
      summary: branch.summary,
      actor: branch.author,
      date: branch.submittedAt ?? branch.createdAt,
      status: branch.status,
      changeCount: branch.changeCount,
      baseRev: branch.baseRev,
      branchKey: span.key,
      highlightKey: span.key,
      laneIndex: span.laneIndex,
      dotX: laneX(span.laneIndex),
      headRails: rails
        .filter((rail) => !rail.tailOnly)
        .sort((a, b) => a.laneIndex - b.laneIndex),
      tailRails: tailOf(rails),
      connectors: [],
      detached: branch.baseRev === null || !onPage.has(branch.baseRev),
    })
  })

  revisions.forEach((revision, index) => {
    const revertsRev = revision.revertsRev ?? null
    const isHead = revision.rev === head
    const labels = revision.changedFields.map((field) =>
      contributionFieldLabel(entityKind, field),
    )

    const mergedKey = `merged:${revision.id}`
    const ownSpan = spanByKey.get(mergedKey) ?? null
    const laneIndex = 0
    const segment = segmentAt(index, revisions.length, hasEarlier)

    const rails: RevisionRail[] = []
    const connectors: RevisionConnector[] = []

    const aboveTrunk = index === 0 && openBranches.length > 0
    const trunkUp = aboveTrunk || (segment !== 'first' && segment !== 'only')
    const trunkDown = segment !== 'last' && segment !== 'only'
    if (trunkUp || trunkDown) {
      rails.push({
        key: 'rail-trunk',
        kind: trunkUp && trunkDown ? 'through' : trunkUp ? 'top' : 'bottom',
        branchKey: TRUNK_KEY,
        laneIndex: 0,
        x: laneX(0),
        color: 'neutral',
        dashed: false,
      })
    }

    for (const span of spans) {
      if (span.key === mergedKey) continue
      if (span.topRev < revision.rev) continue
      if (span.forkRev > revision.rev) continue
      if (span.forkRev === revision.rev) {
        connectors.push(
          makeConnector(
            `fork-${span.key}`,
            'fork',
            span.key,
            span.laneIndex,
            laneIndex,
            span.color,
            span.draft,
          ),
        )
      } else {
        rails.push({
          key: `rail-${span.key}`,
          kind: 'through',
          branchKey: span.key,
          laneIndex: span.laneIndex,
          x: laneX(span.laneIndex),
          color: span.color,
          dashed: span.draft,
        })
      }
    }

    if (ownSpan) {
      connectors.push(
        makeConnector(
          `merge-${revision.id}`,
          'merge',
          ownSpan.key,
          ownSpan.laneIndex,
          0,
          ownSpan.color,
          false,
        ),
      )
      rails.push({
        key: `rail-self-${revision.id}`,
        kind: 'bottom',
        branchKey: ownSpan.key,
        laneIndex: ownSpan.laneIndex,
        x: laneX(ownSpan.laneIndex),
        color: ownSpan.color,
        dashed: false,
        tailOnly: true,
      })
    }

    rows.push({
      type: 'revision',
      id: revision.id,
      lane: 'trunk',
      segment,
      dot: isHead ? 'head' : 'solid',
      color: revertsRev !== null ? 'warning' : OP_COLORS[revision.op],
      icon: revertsRev !== null ? 'i-lucide-undo-2' : OP_ICONS[revision.op],
      dotLabel:
        revertsRev !== null
          ? `Revert, revision ${revision.rev}`
          : `${revision.op} revision ${revision.rev}`,
      title: revisionTitle(revision.op, revision.changedFields, revertsRev),
      summary: revision.changesetSummary,
      actor: revision.editor,
      date: revision.createdAt,
      rev: revision.rev,
      op: revision.op,
      isHead,
      revertsRev,
      changesetId: revision.changesetId,
      changedFields: revision.changedFields,
      fieldLabels: labels.slice(0, maxFieldLabels),
      hiddenFieldLabels: labels.slice(maxFieldLabels),
      canRevert: revision.rev !== head,
      merged: Boolean(ownSpan),
      branchKey: ownSpan ? ownSpan.key : TRUNK_KEY,
      highlightKey: ownSpan ? ownSpan.key : null,
      laneIndex,
      dotX: laneX(laneIndex),
      headRails: rails
        .filter((rail) => !rail.tailOnly)
        .sort((a, b) => a.laneIndex - b.laneIndex),
      tailRails: tailOf(rails),
      connectors,
    })
  })

  return {
    rows,
    laneCount,
    gutterWidth: gutterWidthFor(laneCount),
  }
}
