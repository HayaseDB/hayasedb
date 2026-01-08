import type { Genre } from '../../../types/genre'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  return await authFetchApi<Genre>(event, `/genres/${id}/restore`, { method: 'POST' })
})
