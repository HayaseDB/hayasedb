import type { Genre } from '../../types/genre'
import type { Paginated } from '../../types/pagination'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const queryString = new URLSearchParams(query as Record<string, string>).toString()
  const path = queryString ? `/genres?${queryString}` : '/genres'

  return await fetchApi<Paginated<Genre>>(path)
})
