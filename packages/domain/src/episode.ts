export const ANIME_SEASON_KINDS = [
  'SEASON',
  'COUR',
  'PART',
  'ARC',
  'SPECIALS',
] as const

export const ANIME_EPISODE_TYPES = [
  'REGULAR',
  'SPECIAL',
  'RECAP',
  'PROMO',
] as const

export const ANIME_EPISODE_STATUSES = [
  'UPCOMING',
  'RELEASED',
  'DELAYED',
  'CANCELLED',
] as const

export type AnimeSeasonKind = (typeof ANIME_SEASON_KINDS)[number]
export type AnimeEpisodeType = (typeof ANIME_EPISODE_TYPES)[number]
export type AnimeEpisodeStatus = (typeof ANIME_EPISODE_STATUSES)[number]
