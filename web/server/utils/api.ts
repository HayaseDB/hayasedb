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
    const fetchError = error as FetchError
    const data = fetchError.data as Record<string, unknown> | undefined

    throw createError({
      statusCode: fetchError.statusCode || 500,
      statusMessage: fetchError.statusMessage || 'Internal Server Error',
      data: {
        message: data?.message || fetchError.message,
        error: data?.error,
        statusCode: fetchError.statusCode,
      },
    })
  }
}
