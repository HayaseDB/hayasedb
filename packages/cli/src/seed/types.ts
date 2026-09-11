import type {
  AnimeEpisodeStatus,
  AnimeEpisodeType,
  AnimeFormat,
  AnimeRelationViewKind,
  AnimeSeasonKind,
  AnimeStatus,
  FuzzyDate,
  LocalizationLocale,
} from '@hayasedb/domain'
import type { SeedEnv } from '../env'
import type { UserRole } from '../users'
import type { ApiClient } from './api-client'

export interface SeedUser {
  email: string
  name: string
  password: string
  role: UserRole
  avatar?: string
}

export interface SeedRelation {
  target: string
  kind: AnimeRelationViewKind
}

export interface SeedMedia {
  cover?: string
  banner?: string
  gallery?: string[]
}

export interface SeedAnimeTranslation {
  locale: LocalizationLocale
  title: string
  description?: string
  original?: boolean
}

export interface SeedAnime {
  slug: string
  format: AnimeFormat
  status: AnimeStatus
  translations: SeedAnimeTranslation[]
  startDate?: FuzzyDate
  endDate?: FuzzyDate
  genres: string[]
  relations?: SeedRelation[]
  media?: SeedMedia
}

export interface SeedEpisodeTranslation {
  locale: LocalizationLocale
  title: string
  overview?: string
  original?: boolean
}

export interface SeedEpisode {
  number: string | null
  type: AnimeEpisodeType
  status: AnimeEpisodeStatus
  airDate: string | null
  durationSeconds: number | null
  translations: SeedEpisodeTranslation[]
}

export interface SeedSeason {
  kind: AnimeSeasonKind
  number: string | null
  translations: SeedEpisodeTranslation[]
  episodes: SeedEpisode[]
}

export type SeedStructure =
  | { animeSlug: string; episodes: SeedEpisode[] }
  | { animeSlug: string; seasons: SeedSeason[] }

export interface SeedContext {
  env: SeedEnv
  apiUrl: string
  client: () => Promise<ApiClient>
  clientFor: (user: SeedUser) => Promise<ApiClient>
  loadAsset: (name: string) => Promise<File>
}

export interface SeedStep {
  name: string
  description: string
  dependsOn?: string[]
  provisionsUsers?: boolean
  run: (context: SeedContext) => Promise<void>
}

export interface SeedSet {
  name: string
  description: string
  admin: SeedUser
  assetsUrl: URL
  steps: SeedStep[]
}
