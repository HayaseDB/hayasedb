import type { Anime } from '../../types/anime'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  return await fetchApi<Anime>(`/animes/${slug}`)
})
