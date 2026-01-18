import type { Paginated } from '../common'

export interface GenreResponse {
  id: string
  slug: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type PaginatedGenreResponse = Paginated<GenreResponse>
