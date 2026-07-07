import { createORPCClient } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi/fetch'
import type { JsonifiedClient } from '@orpc/openapi'
import type { RouterContractClient } from '@orpc/contract'
import { contract } from '@hayasedb/contract'

export type ApiClient = JsonifiedClient<RouterContractClient<typeof contract>>

export function useApiClient(): ApiClient {
  const cookie = import.meta.server
    ? useRequestHeaders(['cookie']).cookie
    : undefined
  const url = `${useRequestURL().origin}/api`

  const link = new OpenAPILink(contract, {
    url,
    fetch: (request, init) =>
      globalThis.fetch(request, {
        ...init,
        credentials: 'include',
        headers: { ...init?.headers, ...(cookie ? { cookie } : {}) },
      }),
  } as ConstructorParameters<typeof OpenAPILink>[1])

  return createORPCClient(link) as ApiClient
}
