export default defineEventHandler(async (event) => {
  return await authFetchApi(event, '/users/me/profile-picture', {
    method: 'DELETE',
  })
})
