import {
  ENTITY_FIELD_META,
  fieldOrderFor,
  stableStringify,
  unorderedStringify,
  type AnimeFieldKey,
  type ChangeOp,
  type ChangesetStatus,
  type EntityKind,
  type FieldMeta,
  type MessageKind,
} from '@hayasedb/domain'
import type { AnimeDocument, ChangeDetail } from '@hayasedb/contract'

type BadgeColor = 'success' | 'info' | 'warning' | 'error' | 'neutral'

export const CHANGESET_STATUS_LABELS: Record<ChangesetStatus, string> = {
  draft: 'Draft',
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  superseded: 'Superseded',
}

export const CHANGESET_STATUS_COLORS: Record<ChangesetStatus, BadgeColor> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  withdrawn: 'neutral',
  superseded: 'neutral',
}

export const CHANGE_OP_LABELS: Record<ChangeOp, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
}

export const CHANGE_OP_COLORS: Record<ChangeOp, BadgeColor> = {
  create: 'success',
  update: 'info',
  delete: 'error',
}

export const ANIME_FIELD_LABELS = {
  slug: 'Slug',
  format: 'Format',
  status: 'Status',
  titleRomaji: 'Romaji title',
  titleEnglish: 'English title',
  titleNative: 'Native title',
  description: 'Description',
  startDate: 'Start date',
  endDate: 'End date',
  genreIds: 'Genres',
  media: 'Images',
} satisfies Record<AnimeFieldKey, string> & Record<keyof AnimeDocument, string>

const ANIME_ENUM_LABELS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  format: ANIME_FORMAT_LABELS,
  status: ANIME_STATUS_LABELS,
  type: ANIME_MEDIA_TYPE_LABELS,
}

const ENTITY_FIELD_LABELS: Record<
  EntityKind,
  Readonly<Record<string, string>>
> = {
  anime: ANIME_FIELD_LABELS,
}

const ENTITY_ENUM_LABELS: Record<
  EntityKind,
  Readonly<Record<string, Readonly<Record<string, string>>>>
> = {
  anime: ANIME_ENUM_LABELS,
}

export function contributionFieldLabel(
  kind: EntityKind,
  field: string,
): string {
  return ENTITY_FIELD_LABELS[kind][field] ?? field
}

export function contributionFieldMeta(
  kind: EntityKind,
  field: string,
): FieldMeta | undefined {
  return ENTITY_FIELD_META[kind][field]
}

export function contributionEnumLabel(
  kind: EntityKind,
  field: string,
  value: unknown,
): string {
  return ENTITY_ENUM_LABELS[kind][field]?.[String(value)] ?? String(value)
}

export interface ChangeDiffRow {
  key: string
  field: string
  label: string
  meta: FieldMeta | undefined
  before: unknown
  after: unknown
  currentValue: unknown
  drifted: boolean
  changed: boolean
}

function partOf(value: unknown, by: string, part: string): unknown[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item) =>
      !!item &&
      typeof item === 'object' &&
      (item as Record<string, unknown>)[by] === part,
  )
}

function withoutKeys(item: unknown, keys?: readonly string[]): unknown {
  if (!keys?.length || !item || typeof item !== 'object') return item
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
    if (!keys.includes(key)) rest[key] = value
  }
  return rest
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

function identity(
  value: unknown,
  meta?: FieldMeta,
  positional?: readonly string[],
): string {
  if (isEmptyValue(value)) return 'null'

  if (meta?.unordered) return unorderedStringify(value)

  const isSingleton = !Array.isArray(value) || value.length <= 1
  if (positional?.length && isSingleton) {
    const stripped = Array.isArray(value)
      ? value.map((item) => withoutKeys(item, positional))
      : value
    return stableStringify(stripped)
  }
  return stableStringify(value)
}

function sameValue(
  a: unknown,
  b: unknown,
  meta?: FieldMeta,
  positional?: readonly string[],
): boolean {
  return identity(a, meta, positional) === identity(b, meta, positional)
}

export function buildDiffRows(change: ChangeDetail): ChangeDiffRow[] {
  const isDelete = change.op === 'delete'
  const source = isDelete ? (change.oldValues ?? {}) : change.payload

  const rows = fieldOrderFor(change.entityKind)
    .filter((field) => field in source)
    .flatMap((field): ChangeDiffRow[] => {
      const meta = contributionFieldMeta(change.entityKind, field)
      const label = contributionFieldLabel(change.entityKind, field)

      const oldValue = change.oldValues?.[field] ?? null
      const currentValue = change.currentValues?.[field] ?? null
      const newValue = change.payload[field] ?? null
      const tracked =
        change.currentValues !== null && field in (change.currentValues ?? {})

      if (meta?.parts) {
        const { by, values, positional } = meta.parts
        return values.map((part) => {
          const oldPart = partOf(oldValue, by, part)
          const newPart = partOf(newValue, by, part)
          const currentPart = partOf(currentValue, by, part)
          return {
            key: `${field}:${part}`,
            field,
            label: contributionEnumLabel(change.entityKind, by, part),
            meta,
            before: isDelete ? null : oldPart,
            after: isDelete ? oldPart : newPart,
            currentValue: currentPart,
            drifted:
              tracked && !sameValue(oldPart, currentPart, meta, positional),
            changed: isDelete
              ? oldPart.length > 0
              : !sameValue(oldPart, newPart, meta, positional),
          }
        })
      }

      return [
        {
          key: field,
          field,
          label,
          meta,
          before: isDelete ? null : oldValue,
          after: isDelete ? oldValue : newValue,
          currentValue,
          drifted: tracked && !sameValue(oldValue, currentValue, meta),
          changed: isDelete ? true : !sameValue(oldValue, newValue, meta),
        },
      ]
    })

  return change.op === 'create' ? rows : rows.filter((row) => row.changed)
}

export interface TimelineActor {
  id: string | null
  name: string | null
  image: string | null
}

type TimelineDate = Date | string

export interface TimelineMessage {
  id: string
  author: TimelineActor
  kind: MessageKind
  body: string
  createdAt: TimelineDate
}

export interface TimelineChangeset {
  status: ChangesetStatus
  author: TimelineActor
  decidedBy: TimelineActor | null
  submittedAt: TimelineDate | null
  decidedAt: TimelineDate | null
  changeCount: number
  supersedesId: string | null
  supersededById: string | null
  revertsId: string | null
  revertedBy: {
    changesetId: string
    actor: TimelineActor
    at: TimelineDate
  } | null
  messages: TimelineMessage[]
}

interface TimelineEntryBase {
  id: string
  actor: TimelineActor
  date: TimelineDate
}

export type SubmittedVariant = 'initial' | 'revision' | 'revert'

export type ChangesetTimelineEntry =
  | (TimelineEntryBase & {
      type: 'submitted'
      variant: SubmittedVariant
      targetId: string | null
      changeCount: number
    })
  | (TimelineEntryBase & { type: 'comment'; body: string })
  | (TimelineEntryBase & { type: 'system'; body: string })
  | (TimelineEntryBase & { type: 'rejected'; body: string | null })
  | (TimelineEntryBase & { type: 'approved' | 'withdrawn' })
  | (TimelineEntryBase & { type: 'superseded' | 'reverted'; targetId: string })

const UNKNOWN_ACTOR: TimelineActor = { id: null, name: null, image: null }

const MESSAGE_ENTRY_TYPES: Record<
  MessageKind,
  'comment' | 'system' | 'rejected'
> = {
  comment: 'comment',
  system: 'system',
  rejection: 'rejected',
}

export function buildChangesetTimeline(
  changeset: TimelineChangeset,
): ChangesetTimelineEntry[] {
  const entries: ChangesetTimelineEntry[] = []

  if (changeset.submittedAt) {
    const variant: SubmittedVariant = changeset.revertsId
      ? 'revert'
      : changeset.supersedesId
        ? 'revision'
        : 'initial'
    entries.push({
      id: 'submitted',
      type: 'submitted',
      actor: changeset.author,
      date: changeset.submittedAt,
      variant,
      targetId: changeset.revertsId ?? changeset.supersedesId,
      changeCount: changeset.changeCount,
    })
  }

  for (const message of changeset.messages) {
    entries.push({
      id: message.id,
      type: MESSAGE_ENTRY_TYPES[message.kind],
      actor: message.author,
      date: message.createdAt,
      body: message.body,
    })
  }

  if (changeset.decidedAt) {
    const decision = {
      id: 'decision',
      actor: changeset.decidedBy ?? UNKNOWN_ACTOR,
      date: changeset.decidedAt,
    }
    if (changeset.status === 'approved') {
      entries.push({ ...decision, type: 'approved' })
    } else if (changeset.status === 'withdrawn') {
      entries.push({ ...decision, type: 'withdrawn', actor: changeset.author })
    } else if (changeset.status === 'superseded' && changeset.supersededById) {
      entries.push({
        ...decision,
        type: 'superseded',
        actor: changeset.author,
        targetId: changeset.supersededById,
      })
    } else if (
      changeset.status === 'rejected' &&
      !changeset.messages.some((message) => message.kind === 'rejection')
    ) {
      entries.push({ ...decision, type: 'rejected', body: null })
    }
  }

  if (changeset.revertedBy) {
    entries.push({
      id: 'reverted',
      type: 'reverted',
      actor: changeset.revertedBy.actor,
      date: changeset.revertedBy.at,
      targetId: changeset.revertedBy.changesetId,
    })
  }

  return entries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
}
