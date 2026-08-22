import {
  ANIME_FORMATS,
  ANIME_RELATION_VIEW_KINDS,
  ANIME_SORT_KEYS,
  ANIME_STATUSES,
  MEDIA_MIME_TYPES,
  type AnimeFormat,
  type AnimeRelationViewKind,
  type AnimeSortKey,
  type AnimeStatus,
  type AnimeMediaType,
} from '@hayasedb/domain'

export const MEDIA_ACCEPT = MEDIA_MIME_TYPES.join(',')

export const ANIME_FORMAT_LABELS: Record<AnimeFormat, string> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: 'Special',
  MUSIC: 'Music',
}

export const ANIME_RELATION_VIEW_LABELS: Record<AnimeRelationViewKind, string> =
  {
    SEQUEL: 'Sequel',
    PREQUEL: 'Prequel',
    SIDE_STORY: 'Side story',
    PARENT_STORY: 'Parent story',
    SPIN_OFF: 'Spin-off',
    SPIN_OFF_ORIGIN: 'Spin-off of',
    SUMMARY: 'Summary',
    FULL_STORY: 'Full story',
    ALTERNATIVE: 'Alternative',
    CHARACTER: 'Shared characters',
    OTHER: 'Other',
  }

export const ANIME_STATUS_LABELS: Record<AnimeStatus, string> = {
  FINISHED: 'Finished',
  RELEASING: 'Releasing',
  NOT_YET_RELEASED: 'Not yet released',
  CANCELLED: 'Cancelled',
  HIATUS: 'Hiatus',
}

export const ANIME_STATUS_COLORS: Record<
  AnimeStatus,
  'success' | 'info' | 'warning' | 'error' | 'neutral'
> = {
  FINISHED: 'neutral',
  RELEASING: 'success',
  NOT_YET_RELEASED: 'info',
  CANCELLED: 'error',
  HIATUS: 'warning',
}

export const ANIME_MEDIA_TYPE_LABELS: Record<AnimeMediaType, string> = {
  COVER: 'Cover',
  BANNER: 'Banner',
  GALLERY: 'Gallery',
}

export function animeFormatLabel(
  value: AnimeFormat | null | undefined,
): string | null {
  return value ? ANIME_FORMAT_LABELS[value] : null
}

export function animeStatusLabel(
  value: AnimeStatus | null | undefined,
): string | null {
  return value ? ANIME_STATUS_LABELS[value] : null
}

export function animeStatusColor(
  value: AnimeStatus | null | undefined,
): 'success' | 'info' | 'warning' | 'error' | 'neutral' {
  return value ? ANIME_STATUS_COLORS[value] : 'neutral'
}

const ANIME_STATUS_TEXT_CLASSES: Record<
  ReturnType<typeof animeStatusColor>,
  string
> = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-highlighted',
}

export function animeStatusTextClass(
  value: AnimeStatus | null | undefined,
): string {
  return ANIME_STATUS_TEXT_CLASSES[animeStatusColor(value)]
}

export const animeFormatOptions = ANIME_FORMATS.map((value) => ({
  value,
  label: ANIME_FORMAT_LABELS[value],
}))

export const animeStatusOptions = ANIME_STATUSES.map((value) => ({
  value,
  label: ANIME_STATUS_LABELS[value],
}))

export const animeRelationViewOptions = ANIME_RELATION_VIEW_KINDS.map(
  (value) => ({
    value,
    label: ANIME_RELATION_VIEW_LABELS[value],
  }),
)

export const ANIME_SORT_LABELS: Record<AnimeSortKey, string> = {
  'recent-desc': 'Newest',
  'recent-asc': 'Oldest',
  'title-asc': 'Title A–Z',
  'title-desc': 'Title Z–A',
  'start-desc': 'Release date, newest',
  'start-asc': 'Release date, oldest',
}

export const animeSortOptions = ANIME_SORT_KEYS.map((value) => ({
  value,
  label: ANIME_SORT_LABELS[value],
}))
