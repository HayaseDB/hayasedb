import { ANIME_MEDIA_TYPES } from './anime'
import type { EntityKind } from './contribution'

export type FieldRender =
  | 'text'
  | 'longtext'
  | 'enum'
  | 'fuzzydate'
  | 'date'
  | 'number'
  | 'ref'
  | 'media'
  | 'localized'

export type RefTarget = 'genre' | 'mediaAsset' | 'anime' | 'animeSeason'

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
  translations: { as: 'localized', empty: 'emptyArray' },
  startDate: { as: 'fuzzydate', empty: null },
  endDate: { as: 'fuzzydate', empty: null },
  genreIds: {
    as: 'ref',
    ref: 'genre',
    refPath: 'self',
    unordered: true,
    empty: 'emptyArray',
  },
  relations: {
    as: 'ref',
    ref: 'anime',
    refPath: 'targetId',
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
  slug: { as: 'text', empty: '' },
  translations: { as: 'localized', empty: 'emptyArray' },
} as const satisfies Record<string, FieldMeta>

export const ANIME_SEASON_FIELD_META = {
  animeId: { as: 'ref', ref: 'anime', refPath: 'self', empty: null },
  kind: { as: 'enum', empty: null },
  number: { as: 'number', empty: null },
  position: { as: 'number', empty: null },
  translations: { as: 'localized', empty: 'emptyArray' },
} as const satisfies Record<string, FieldMeta>

export const ANIME_EPISODE_FIELD_META = {
  animeId: { as: 'ref', ref: 'anime', refPath: 'self', empty: null },
  seasonId: {
    as: 'ref',
    ref: 'animeSeason',
    refPath: 'self',
    empty: null,
  },
  number: { as: 'number', empty: null },
  position: { as: 'number', empty: null },
  type: { as: 'enum', empty: null },
  status: { as: 'enum', empty: null },
  airDate: { as: 'date', empty: null },
  durationSeconds: { as: 'number', empty: null },
  stillMediaId: {
    as: 'ref',
    ref: 'mediaAsset',
    refPath: 'self',
    empty: null,
  },
  translations: { as: 'localized', empty: 'emptyArray' },
} as const satisfies Record<string, FieldMeta>

export const GENRE_FIELD_ORDER = [
  'slug',
  'translations',
] as const satisfies ReadonlyArray<keyof typeof GENRE_FIELD_META>

export const ANIME_FIELD_ORDER = [
  'slug',
  'format',
  'status',
  'translations',
  'startDate',
  'endDate',
  'genreIds',
  'relations',
  'media',
] as const satisfies ReadonlyArray<keyof typeof ANIME_FIELD_META>

export const ANIME_SEASON_FIELD_ORDER = [
  'animeId',
  'kind',
  'number',
  'position',
  'translations',
] as const satisfies ReadonlyArray<keyof typeof ANIME_SEASON_FIELD_META>

export const ANIME_EPISODE_FIELD_ORDER = [
  'animeId',
  'seasonId',
  'number',
  'position',
  'type',
  'status',
  'airDate',
  'durationSeconds',
  'stillMediaId',
  'translations',
] as const satisfies ReadonlyArray<keyof typeof ANIME_EPISODE_FIELD_META>

export type AnimeFieldKey = (typeof ANIME_FIELD_ORDER)[number]

export const ENTITY_FIELD_META: Record<
  EntityKind,
  Readonly<Record<string, FieldMeta>>
> = {
  anime: ANIME_FIELD_META,
  animeSeason: ANIME_SEASON_FIELD_META,
  animeEpisode: ANIME_EPISODE_FIELD_META,
  genre: GENRE_FIELD_META,
}

export const ENTITY_FIELD_ORDER = {
  anime: ANIME_FIELD_ORDER,
  animeSeason: ANIME_SEASON_FIELD_ORDER,
  animeEpisode: ANIME_EPISODE_FIELD_ORDER,
  genre: GENRE_FIELD_ORDER,
} as const satisfies Record<EntityKind, ReadonlyArray<string>>

export function fieldOrderFor(kind: EntityKind): ReadonlyArray<string> {
  return ENTITY_FIELD_ORDER[kind]
}
