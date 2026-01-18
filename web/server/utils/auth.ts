import type { H3Event } from 'h3'
import type { RefreshResponse } from '~~/shared/types'

function getApiUrl(): string {
  return useRuntimeConfig().apiUrl
}

function isTokenExpired(tokenExpires: number): boolean {
  return Date.now() >= tokenExpires * 1000
}

type QueryParams = Record<string, unknown>

function buildUrl(path: string, query?: QueryParams): string {
  const base = `${getApiUrl()}${path}`
  if (!query) return base

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v !== undefined && v !== null) {
          params.append(key, String(v))
        }
      }
    } else {
      params.set(key, String(value))
    }
  }
  const queryString = params.toString()
  return queryString ? `${base}?${queryString}` : base
}

export async function publicApi<T>(
  path: string,
  init?: {
    method?: string
    body?: unknown
    headers?: HeadersInit
    query?: QueryParams
  },
): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.delete('content-length')
  headers.delete('host')
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(buildUrl(path, init?.query), {
    method: init?.method ?? 'GET',
    headers,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw createError({ statusCode: res.status, message: data.message, data })
  }
  return data
}

async function getValidAccessToken(event: H3Event): Promise<string> {
  const session = await getUserSession(event)
  const secure = session.secure

  if (!secure?.accessToken && !secure?.refreshToken) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  if (secure.accessToken && secure.tokenExpires && !isTokenExpired(secure.tokenExpires)) {
    return secure.accessToken
  }

  if (!secure.refreshToken) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, message: 'Session expired' })
  }

  const refreshed = await refreshTokens(event, secure.refreshToken)
  if (!refreshed) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, message: 'Session expired' })
  }

  const newSession = await getUserSession(event)
  return newSession.secure!.accessToken
}

export async function authApi<T>(
  event: H3Event,
  path: string,
  init?: {
    method?: string
    body?: unknown
    query?: QueryParams
  },
): Promise<T> {
  const accessToken = await getValidAccessToken(event)

  try {
    return await makeAuthenticatedRequest<T>(path, accessToken, init)
  } catch (error: unknown) {
    const err = error as { statusCode?: number }

    if (err.statusCode === 401) {
      const session = await getUserSession(event)
      if (session.secure?.refreshToken) {
        const refreshed = await refreshTokens(event, session.secure.refreshToken)
        if (refreshed) {
          const newSession = await getUserSession(event)
          return makeAuthenticatedRequest<T>(path, newSession.secure!.accessToken, init)
        }
      }
      await clearUserSession(event)
    }

    throw error
  }
}

async function makeAuthenticatedRequest<T>(
  path: string,
  token: string,
  init?: {
    method?: string
    body?: unknown
    query?: QueryParams
  },
): Promise<T> {
  const res = await fetch(buildUrl(path, init?.query), {
    method: init?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw createError({ statusCode: res.status, message: data.message, data })
  }
  return data
}

export async function authApiMultipart<T>(
  event: H3Event,
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST',
): Promise<T> {
  const accessToken = await getValidAccessToken(event)

  const res = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw createError({ statusCode: res.status, message: data.message, data })
  }
  return data
}

async function refreshTokens(event: H3Event, refreshToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken}` },
    })

    if (!res.ok) return false

    const tokens: RefreshResponse = await res.json()
    const session = await getUserSession(event)

    await replaceUserSession(event, {
      user: session.user,
      loggedInAt: session.loggedInAt,
      secure: {
        accessToken: tokens.token,
        refreshToken: tokens.refreshToken,
        tokenExpires: tokens.tokenExpires,
      },
    })

    return true
  } catch {
    return false
  }
}
