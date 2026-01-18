export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await authApi<AnimeResponse>(event, '/animes', {
    method: 'POST',
    body,
  })
})
