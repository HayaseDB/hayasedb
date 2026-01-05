import type { H3Event } from 'h3'
import type { FetchError } from 'ofetch'

interface ApiErrorData {
  message: string
  statusCode: number
  error?: string
}

function getClientIp(event: H3Event): string | undefined {
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]
    return firstIp?.trim()
  }

  const realIp = getHeader(event, 'x-real-ip')
  if (realIp) return realIp

  const cfIp = getHeader(event, 'cf-connecting-ip')
  if (cfIp) return cfIp

  return event.node.req.socket?.remoteAddress
}

export function getClientHeaders(event: H3Event): Record<string, string> {
  const headers: Record<string, string> = {}

  const userAgent = getHeader(event, 'user-agent')
  if (userAgent) {
    headers['User-Agent'] = userAgent
  }

  const clientIp = getClientIp(event)
  if (clientIp) {
    headers['X-Forwarded-For'] = clientIp
  }

  return headers
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
