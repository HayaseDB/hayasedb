export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await authApi(event, '/users/me/password', {
    method: 'PATCH',
    body,
  })
})
