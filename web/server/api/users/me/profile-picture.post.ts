import type { FetchError } from 'ofetch'

interface ApiErrorData {
  message: string
  statusCode: number
  error?: string
}

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }

  const file = formData.find((f) => f.name === 'file')

  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'File field missing' })
  }

  const config = useRuntimeConfig()
  const url = `${config.apiUrl}/users/me/profile-picture`

  const uint8Array = new Uint8Array(file.data)
  const blob = new Blob([uint8Array], { type: file.type || 'application/octet-stream' })
  const backendFormData = new FormData()
  backendFormData.append('file', blob, file.filename || 'profile-picture')

  try {
    const response = await $fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: backendFormData,
    })

    return response
  } catch (error) {
    const fetchError = error as FetchError<ApiErrorData>

    throw createError({
      statusCode: fetchError.statusCode || 503,
      statusMessage: fetchError.statusMessage || 'Service Unavailable',
      data: {
        message: fetchError.data?.message || 'Unable to upload profile picture',
      },
    })
  }
})
