export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const file = formData.find((f) => f.name === 'file')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'File field missing' })
  }

  const blob = new Blob([new Uint8Array(file.data)], {
    type: file.type || 'application/octet-stream',
  })
  const backendFormData = new FormData()
  backendFormData.append('file', blob, file.filename || 'profile-picture')

  return await authApiMultipart<UserResponse>(event, '/users/me/profile-picture', backendFormData)
})
