import type { Anime } from '../../types/anime'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await authFetchApi<Anime>(event, `/animes/${id}`, {
    method: 'PATCH',
    body,
  })
})
