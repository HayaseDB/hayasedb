export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  return await authApi<CurrentUserResponse>(event, '/auth/me')
})
