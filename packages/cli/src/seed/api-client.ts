import { createORPCClient } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi/fetch'
import type { JsonifiedClient } from '@orpc/openapi'
import type { RouterContractClient } from '@orpc/contract'
import { contract, INTERNAL_TOKEN_HEADER } from '@hayasedb/contract'
import { consola } from 'consola'

export type ApiClient = JsonifiedClient<RouterContractClient<typeof contract>>

export interface ApiClientOptions {
  apiUrl: string
  cookie?: string
  internalToken?: string
}

function buildHeaders(options: ApiClientOptions): Record<string, string> {
  return {
    ...(options.cookie && { cookie: options.cookie }),
    ...(options.internalToken && {
      [INTERNAL_TOKEN_HEADER]: options.internalToken,
    }),
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const link = new OpenAPILink(contract, {
    url: '/api',
    origin: options.apiUrl.replace(/\/$/, ''),
    headers: () => buildHeaders(options),
  })
  return createORPCClient(link) as ApiClient
}

export async function assertApiReachable(options: ApiClientOptions) {
  try {
    await createApiClient(options).system.ping({})
  } catch {
    consola.error(
      `The API at ${options.apiUrl} is not reachable. Start it first (bun dev) or pass --api-url.`,
    )
    process.exit(1)
  }
}

export async function signIn(
  options: ApiClientOptions,
  email: string,
  password: string,
): Promise<string> {
  const res = await fetch(
    `${options.apiUrl.replace(/\/$/, '')}/api/auth/sign-in/email`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...buildHeaders(options),
      },
      body: JSON.stringify({ email, password }),
    },
  )
  if (!res.ok) {
    consola.error(
      `Sign-in as ${email} failed: ${res.status} ${await res.text()}`,
    )
    process.exit(1)
  }
  const cookie = res.headers
    .getSetCookie()
    .map((entry) => entry.split(';')[0])
    .filter(Boolean)
    .join('; ')
  if (!cookie) {
    consola.error('Sign-in succeeded but no session cookie was returned.')
    process.exit(1)
  }
  return cookie
}
