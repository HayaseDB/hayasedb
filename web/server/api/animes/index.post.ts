import type { Anime } from '../../types/anime'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await authFetchApi<Anime>(event, '/animes', {
    method: 'POST',
    body,
  })
})
