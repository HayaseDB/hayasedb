import {
  ENTITY_FIELD_META,
  fieldOrderFor,
  sameFieldValue,
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

export const ENTITY_KIND_LABELS: Record<EntityKind, string> = {
  anime: 'Anime',
  animeSeason: 'Season',
  animeEpisode: 'Episode',
  genre: 'Genre',
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
  translations: 'Localized content',
  startDate: 'Start date',
  endDate: 'End date',
  genreIds: 'Genres',
  relations: 'Relations',
  media: 'Images',
} satisfies Record<AnimeFieldKey, string> & Record<keyof AnimeDocument, string>

const ANIME_ENUM_LABELS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  format: ANIME_FORMAT_LABELS,
  status: ANIME_STATUS_LABELS,
  kind: ANIME_RELATION_VIEW_LABELS,
  type: ANIME_MEDIA_TYPE_LABELS,
}

export const GENRE_FIELD_LABELS = {
  slug: 'Slug',
  translations: 'Localized names',
} satisfies Record<string, string>

export const ANIME_SEASON_FIELD_LABELS = {
  animeId: 'Anime',
  kind: 'Kind',
  number: 'Number',
  position: 'Position',
  translations: 'Localized titles',
} satisfies Record<string, string>

export const ANIME_EPISODE_FIELD_LABELS = {
  animeId: 'Anime',
  seasonId: 'Season',
  number: 'Number',
  position: 'Position',
  type: 'Type',
  status: 'Status',
  airDate: 'Air date',
  durationSeconds: 'Duration',
  stillMediaId: 'Still image',
  translations: 'Localized titles',
} satisfies Record<string, string>

const ANIME_SEASON_ENUM_LABELS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  kind: ANIME_SEASON_KIND_LABELS,
}

const ANIME_EPISODE_ENUM_LABELS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  type: ANIME_EPISODE_TYPE_LABELS,
  status: ANIME_EPISODE_STATUS_LABELS,
}

const ENTITY_FIELD_LABELS: Record<
  EntityKind,
  Readonly<Record<string, string>>
> = {
  anime: ANIME_FIELD_LABELS,
  animeSeason: ANIME_SEASON_FIELD_LABELS,
  animeEpisode: ANIME_EPISODE_FIELD_LABELS,
  genre: GENRE_FIELD_LABELS,
}

const ENTITY_ENUM_LABELS: Record<
  EntityKind,
  Readonly<Record<string, Readonly<Record<string, string>>>>
> = {
  anime: ANIME_ENUM_LABELS,
  animeSeason: ANIME_SEASON_ENUM_LABELS,
  animeEpisode: ANIME_EPISODE_ENUM_LABELS,
  genre: {},
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

export function changesetAnimeChange(
  changes: ChangeDetail[],
): ChangeDetail | undefined {
  return changes.find((change) => change.entityKind === 'anime')
}

export function changesetAnimeId(changes: ChangeDetail[]): string | null {
  const animeChange = changesetAnimeChange(changes)
  if (animeChange) return animeChange.entityId
  for (const change of changes) {
    const value = change.payload.animeId
    if (typeof value === 'string') return value
  }
  return null
}

export function changesetSeasonId(changes: ChangeDetail[]): string | null {
  for (const change of changes) {
    if (change.entityKind === 'animeSeason') return change.entityId
    const value = change.payload.seasonId
    if (typeof value === 'string') return value
  }
  return null
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
              tracked &&
              !sameFieldValue(oldPart, currentPart, meta, positional),
            changed: isDelete
              ? oldPart.length > 0
              : !sameFieldValue(oldPart, newPart, meta, positional),
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
          drifted: tracked && !sameFieldValue(oldValue, currentValue, meta),
          changed: isDelete ? true : !sameFieldValue(oldValue, newValue, meta),
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

export type TimelineDate = Date | string

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

export interface RevisionDiffSource {
  id: string
  entityId: string
  entityKind: EntityKind
  op: ChangeOp
  rev: number
  changedFields: string[]
  snapshot: Record<string, unknown>
  previousSnapshot: Record<string, unknown> | null
}

function pickKeys(
  document: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const picked: Record<string, unknown> = {}
  for (const key of keys) {
    if (key in document) picked[key] = document[key]
  }
  return picked
}

export function revisionDiffChange(revision: RevisionDiffSource): ChangeDetail {
  const isDelete = revision.op === 'delete'
  const previous = revision.previousSnapshot
  return {
    id: revision.id,
    ord: 0,
    entityKind: revision.entityKind,
    entityId: revision.entityId,
    op: revision.op,
    baseRev: revision.rev > 1 ? revision.rev - 1 : null,
    payload: isDelete
      ? {}
      : pickKeys(revision.snapshot, revision.changedFields),
    oldValues: previous
      ? isDelete
        ? previous
        : pickKeys(previous, revision.changedFields)
      : null,
    currentValues: null,
    headRev: null,
    conflicted: false,
    appliedRevisionId: revision.id,
  }
}
