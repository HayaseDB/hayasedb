import type { BasePaginationQuery, SortOrder } from '../common'
import type { GenreSortField } from './enums'

export interface CreateGenreRequest {
  name: string
  description?: string
}

export interface UpdateGenreRequest {
  name?: string
  description?: string
}

export interface GenreQuery extends BasePaginationQuery {
  search?: string
  sort?: GenreSortField
  order?: SortOrder
}
