import type { Anime } from '../../../types/anime'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authFetchApi<Anime>(event, `/animes/${id}/restore`, { method: 'POST' })
})
