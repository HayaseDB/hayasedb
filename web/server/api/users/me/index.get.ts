export default defineEventHandler(async (event) => {
  return await authApi<UserResponse>(event, '/users/me')
})
