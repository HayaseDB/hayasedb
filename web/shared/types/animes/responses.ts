import type { Paginated } from '../common'
import type { GenreResponse } from '../genres'
import type { MediaResponse } from '../media'
import type { AnimeFormat, AnimeStatus } from './enums'

export interface AnimeResponse {
  id: string
  slug: string
  title: string
  synopsis: string | null
  format: AnimeFormat
  status: AnimeStatus
  year: number | null
  genres?: GenreResponse[]
  cover?: MediaResponse | null
  createdAt: string
  updatedAt: string
}

export type PaginatedAnimeResponse = Paginated<AnimeResponse>
