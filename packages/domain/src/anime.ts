export const ANIME_FORMATS = [
  'TV',
  'TV_SHORT',
  'MOVIE',
  'OVA',
  'ONA',
  'SPECIAL',
  'MUSIC',
] as const
export const ANIME_STATUSES = [
  'FINISHED',
  'RELEASING',
  'NOT_YET_RELEASED',
  'CANCELLED',
  'HIATUS',
] as const
export const ANIME_MEDIA_TYPES = ['COVER', 'BANNER', 'GALLERY'] as const
export const ANIME_SORT_KEYS = [
  '-createdAt',
  'createdAt',
  'title',
  '-title',
  '-startDate',
  'startDate',
] as const

export type AnimeFormat = (typeof ANIME_FORMATS)[number]
export type AnimeStatus = (typeof ANIME_STATUSES)[number]
export type AnimeMediaType = (typeof ANIME_MEDIA_TYPES)[number]
export type AnimeSortKey = (typeof ANIME_SORT_KEYS)[number]
