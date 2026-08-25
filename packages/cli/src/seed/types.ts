import type {
  AnimeFormat,
  AnimeRelationViewKind,
  AnimeStatus,
  FuzzyDate,
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

export interface SeedAnime {
  slug: string
  format: AnimeFormat
  status: AnimeStatus
  titleRomaji?: string
  titleEnglish?: string
  titleNative?: string
  description?: string
  startDate?: FuzzyDate
  endDate?: FuzzyDate
  genres: string[]
  relations?: SeedRelation[]
  media?: SeedMedia
}

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
