import {
  ANIME_FORMATS,
  ANIME_STATUSES,
  MEDIA_MIME_TYPES,
  type AnimeFormat,
  type AnimeStatus,
  type AnimeMediaType,
} from '@hayasedb/domain'

export const MEDIA_ACCEPT = MEDIA_MIME_TYPES.join(',')

export const ANIME_FORMAT_LABELS: Record<AnimeFormat, string> = {
  TV: 'TV',
  MOVIE: 'Movie',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: 'Special',
}

export const ANIME_STATUS_LABELS: Record<AnimeStatus, string> = {
  FINISHED: 'Finished',
  RELEASING: 'Releasing',
  NOT_YET_RELEASED: 'Not yet released',
  CANCELLED: 'Cancelled',
  HIATUS: 'Hiatus',
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

export const animeFormatOptions = ANIME_FORMATS.map((value) => ({
  value,
  label: ANIME_FORMAT_LABELS[value],
}))

export const animeStatusOptions = ANIME_STATUSES.map((value) => ({
  value,
  label: ANIME_STATUS_LABELS[value],
}))
