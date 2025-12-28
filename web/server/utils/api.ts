import type { FetchError } from 'ofetch'

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
  const method = options.method || 'GET'

  try {
    const response = await $fetch<T>(url, {
      method,
      body: options.body,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    return response as T
  } catch (error) {
    const fetchError = error as FetchError

    if (!fetchError.response) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Unavailable',
        data: {
          message: 'Unable to connect to the API server',
          code: 'NETWORK_ERROR',
          path,
        },
      })
    }

    const data = fetchError.data as Record<string, unknown> | undefined
    const statusCode = fetchError.statusCode || 500
    const message = (data?.message as string) || fetchError.message || 'An error occurred'

    throw createError({
      statusCode,
      statusMessage: fetchError.statusMessage || 'API Error',
      data: {
        message,
        error: data?.error,
        code: data?.code,
        path,
      },
    })
  }
}
