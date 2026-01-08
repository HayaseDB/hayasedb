import type { Genre } from '../../types/genre'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await authFetchApi<Genre>(event, '/genres', {
    method: 'POST',
    body,
  })
})
