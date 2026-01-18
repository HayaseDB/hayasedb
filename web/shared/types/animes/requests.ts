import type { BasePaginationQuery, SortOrder } from '../common'
import type { AnimeFormat, AnimeSortField, AnimeStatus } from './enums'

export interface CreateAnimeRequest {
  title: string
  synopsis?: string
  format: AnimeFormat
  status: AnimeStatus
  year?: number
  genres?: string[]
}

export interface UpdateAnimeRequest {
  title?: string
  synopsis?: string
  format?: AnimeFormat
  status?: AnimeStatus
  year?: number
  genres?: string[]
}

export interface AnimeQuery extends BasePaginationQuery {
  search?: string
  format?: AnimeFormat
  status?: AnimeStatus
  year?: number
  sort?: AnimeSortField
  order?: SortOrder
}
