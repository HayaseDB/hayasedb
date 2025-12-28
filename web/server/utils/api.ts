import type { H3Event } from 'h3'
import type { FetchError } from 'ofetch'

interface ApiErrorData {
  message: string
  statusCode: number
  error?: string
}

export async function authFetchApi<T>(
  event: H3Event,
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: Record<string, unknown>
  } = {},
): Promise<T> {
  const authHeader = getHeader(event, 'Authorization')

  if (!authHeader) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  return fetchApi<T>(path, {
    ...options,
    headers: { Authorization: authHeader },
  })
}

export async function fetchApi<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: Record<string, unknown>
    headers?: Record<string, string>
  } = {},
): Promise<T> {
  const config = useRuntimeConfig()
  const url = `${config.apiUrl}${path}`

  try {
    const response = await $fetch(url, {
      method: options.method || 'GET',
      body: options.body,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    return response as T
  } catch (error) {
    const fetchError = error as FetchError<ApiErrorData>

    throw createError({
      statusCode: fetchError.statusCode || 503,
      statusMessage: fetchError.statusMessage || 'Service Unavailable',
      data: {
        message: fetchError.data?.message || 'Unable to connect to API',
      },
    })
  }
}
