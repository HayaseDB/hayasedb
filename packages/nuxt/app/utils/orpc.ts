import { createORPCClient } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi/fetch'
import type { JsonifiedClient } from '@orpc/openapi'
import type { RouterContractClient } from '@orpc/contract'
import { contract } from '@hayasedb/contract'

export type ApiClient = JsonifiedClient<RouterContractClient<typeof contract>>

export function createApiClient(
  origin: string,
  extraHeaders?: Record<string, string>,
): ApiClient {
  const link = new OpenAPILink(contract, {
    url: `${origin}/api`,
    fetch: (request, init) =>
      globalThis.fetch(request, {
        ...init,
        credentials: 'include',
        headers: { ...init?.headers, ...extraHeaders },
      }),
  } as ConstructorParameters<typeof OpenAPILink>[1])

  return createORPCClient(link) as ApiClient
}
