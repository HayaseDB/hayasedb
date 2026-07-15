import { createORPCClient } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi/fetch'
import type { OpenAPILinkOptions } from '@orpc/openapi/fetch'
import type { JsonifiedClient } from '@orpc/openapi'
import type { RouterContractClient } from '@orpc/contract'
import { contract } from '@hayasedb/contract'

export type ApiClient = JsonifiedClient<RouterContractClient<typeof contract>>

type ApiClientOptions = Pick<
  OpenAPILinkOptions<Record<never, never>>,
  'origin' | 'headers'
>

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const link = new OpenAPILink(contract, {
    url: '/api',
    ...options,
    fetch: (url, init) =>
      globalThis.fetch(url, { ...init, credentials: 'include' }),
  })

  return createORPCClient(link) as ApiClient
}
