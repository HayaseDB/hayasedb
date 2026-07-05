import { createORPCClient } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi/fetch'
import type { JsonifiedClient } from '@orpc/openapi'
import type { RouterContractClient } from '@orpc/contract'
import { contract } from '@hayasedb/contract'

export type ApiClient = JsonifiedClient<RouterContractClient<typeof contract>>

export function makeClient(baseUrl: string): ApiClient {
  const link = new OpenAPILink(contract, {
    url: baseUrl,
  } as ConstructorParameters<typeof OpenAPILink>[1])
  return createORPCClient(link) as ApiClient
}
