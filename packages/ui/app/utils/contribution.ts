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

function identity(
  value: unknown,
  meta?: FieldMeta,
  positional?: readonly string[],
): string {
  if (meta?.unordered) return unorderedStringify(value ?? null)

  const isSingleton = !Array.isArray(value) || value.length <= 1
  if (positional?.length && isSingleton) {
    const stripped = Array.isArray(value)
      ? value.map((item) => withoutKeys(item, positional))
      : value
    return stableStringify(stripped ?? null)
  }
  return stableStringify(value ?? null)
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
