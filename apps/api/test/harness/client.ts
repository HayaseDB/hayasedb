import { createORPCClient } from '@orpc/client'
import type { RouterContractClient } from '@orpc/contract'
import type { JsonifiedClient } from '@orpc/openapi'
import { OpenAPILink } from '@orpc/openapi/fetch'
import {
  API_KEY_HEADER,
  INTERNAL_TOKEN_HEADER,
  contract,
} from '@hayasedb/contract'

export type TestClient = JsonifiedClient<RouterContractClient<typeof contract>>

export interface CookieJar {
  cookies: Map<string, string>
  header(): string | undefined
  absorb(response: Response): void
}

export function createCookieJar(): CookieJar {
  const cookies = new Map<string, string>()
  return {
    cookies,
    header: () =>
      cookies.size
        ? [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
        : undefined,
    absorb(response) {
      for (const raw of response.headers.getSetCookie()) {
        const [pair, ...attrs] = raw.split(';')
        const eq = pair!.indexOf('=')
        const name = pair!.slice(0, eq).trim()
        const value = pair!.slice(eq + 1).trim()
        const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a))
        if (expired || value === '') cookies.delete(name)
        else cookies.set(name, value)
      }
    },
  }
}

export interface ClientOptions {
  apiKey?: string
  internalToken?: string
  forwardedFor?: string
}

let clientCounter = 0

export function uniqueForwardedFor(): string {
  clientCounter += 1
  const worker = Number(process.env.VITEST_POOL_ID ?? 0) % 200
  return `10.${11 + worker}.${Math.floor(clientCounter / 250) % 250}.${clientCounter % 250}`
}

export interface TestHttp {
  client: TestClient
  jar: CookieJar
  fetch(path: string, init?: RequestInit): Promise<Response>
}

export function createTestHttp(
  baseUrl: string,
  options: ClientOptions = {},
): TestHttp {
  const jar = createCookieJar()
  const forwardedFor = options.forwardedFor ?? uniqueForwardedFor()

  const headers = (): Record<string, string> => {
    const result: Record<string, string> = { 'x-forwarded-for': forwardedFor }
    if (options.apiKey) result[API_KEY_HEADER] = options.apiKey
    if (options.internalToken)
      result[INTERNAL_TOKEN_HEADER] = options.internalToken
    const cookie = jar.header()
    if (cookie) result.cookie = cookie
    return result
  }

  const jarFetch = async (
    input: Request | string | URL,
    init?: RequestInit,
  ) => {
    const merged = new Headers(
      input instanceof Request ? input.headers : init?.headers,
    )
    for (const [k, v] of Object.entries(headers())) {
      if (!merged.has(k)) merged.set(k, v)
    }
    const request =
      input instanceof Request
        ? new Request(input, { headers: merged, redirect: 'manual' })
        : new Request(input, { ...init, headers: merged, redirect: 'manual' })
    const response = await globalThis.fetch(request)
    jar.absorb(response)
    return response
  }

  const link = new OpenAPILink(contract, {
    origin: baseUrl as `http://${string}`,
    url: '/api',
    fetch: jarFetch,
  })

  return {
    client: createORPCClient(link) as TestClient,
    jar,
    fetch: (path, init) => jarFetch(`${baseUrl}${path}`, init),
  }
}
