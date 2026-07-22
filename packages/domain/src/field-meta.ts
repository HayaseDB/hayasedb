import { ANIME_MEDIA_TYPES } from './anime'
import type { EntityKind } from './contribution'

export type FieldRender =
  'text' | 'longtext' | 'enum' | 'date' | 'ref' | 'media'

export type RefTarget = 'genre' | 'mediaAsset'

export type FieldEmpty = '' | null | 'emptyArray'

export interface FieldParts {
  readonly by: string
  readonly values: readonly string[]
  readonly positional?: readonly string[]
}

export interface FieldMeta {
  readonly as: FieldRender

  readonly ref?: RefTarget

  readonly refPath?: string

  readonly parts?: FieldParts

  readonly unordered?: boolean

  readonly empty: FieldEmpty
}

export const ANIME_FIELD_META = {
  slug: { as: 'text', empty: '' },
  format: { as: 'enum', empty: null },
  status: { as: 'enum', empty: null },
  titleRomaji: { as: 'text', empty: '' },
  titleEnglish: { as: 'text', empty: '' },
  titleNative: { as: 'text', empty: '' },
  description: { as: 'longtext', empty: '' },
  startDate: { as: 'date', empty: '' },
  endDate: { as: 'date', empty: '' },
  genreIds: {
    as: 'ref',
    ref: 'genre',
    refPath: 'self',
    unordered: true,
    empty: 'emptyArray',
  },
  media: {
    as: 'media',
    ref: 'mediaAsset',
    refPath: 'mediaId',
    parts: {
      by: 'type',
      values: ANIME_MEDIA_TYPES,
      positional: ['position'],
    },
    empty: 'emptyArray',
  },
} as const satisfies Record<string, FieldMeta>

export const GENRE_FIELD_META = {
  name: { as: 'text', empty: '' },
} as const satisfies Record<string, FieldMeta>

export const GENRE_FIELD_ORDER = ['name'] as const satisfies ReadonlyArray<
  keyof typeof GENRE_FIELD_META
>

export const ANIME_FIELD_ORDER = [
  'slug',
  'format',
  'status',
  'titleRomaji',
  'titleEnglish',
  'titleNative',
  'description',
  'startDate',
  'endDate',
  'genreIds',
  'media',
] as const satisfies ReadonlyArray<keyof typeof ANIME_FIELD_META>

export type AnimeFieldKey = (typeof ANIME_FIELD_ORDER)[number]

export const ENTITY_FIELD_META: Record<
  EntityKind,
  Readonly<Record<string, FieldMeta>>
> = {
  anime: ANIME_FIELD_META,
  genre: GENRE_FIELD_META,
}

export const ENTITY_FIELD_ORDER = {
  anime: ANIME_FIELD_ORDER,
  genre: GENRE_FIELD_ORDER,
} as const satisfies Record<EntityKind, ReadonlyArray<string>>

export function fieldOrderFor(kind: EntityKind): ReadonlyArray<string> {
  return ENTITY_FIELD_ORDER[kind]
}
