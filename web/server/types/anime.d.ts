import type { Genre } from './genre'

export type AnimeFormat = 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music'
export type AnimeStatus = 'releasing' | 'finished' | 'upcoming' | 'cancelled' | 'hiatus'

export interface Anime {
  id: string
  slug: string
  title: string
  synopsis: string | null
  format: AnimeFormat
  status: AnimeStatus
  year: number | null
  genres?: Genre[]
  createdAt: string
  updatedAt: string
}
