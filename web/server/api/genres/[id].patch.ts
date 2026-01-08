import type { Genre } from '../../types/genre'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await authFetchApi<Genre>(event, `/genres/${id}`, {
    method: 'PATCH',
    body,
  })
})
