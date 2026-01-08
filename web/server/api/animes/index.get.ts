import type { Anime } from '../../types/anime'
import type { Paginated } from '../../types/pagination'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const path = queryString ? `/animes?${queryString}` : '/animes'

  return await fetchApi<Paginated<Anime>>(path)
})
