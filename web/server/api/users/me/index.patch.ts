export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  return await authApi<UserResponse>(event, '/users/me', {
    method: 'PATCH',
    body,
  })
})
