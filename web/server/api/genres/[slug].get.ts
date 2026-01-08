import type { Genre } from '../../types/genre'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  return await fetchApi<Genre>(`/genres/${slug}`)
})
