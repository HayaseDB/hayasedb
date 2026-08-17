import { createORPCClient, onError } from '@orpc/client'
import { OpenAPILink } from '@orpc/openapi/fetch'
import type { OpenAPILinkOptions } from '@orpc/openapi/fetch'
import type { JsonifiedClient } from '@orpc/openapi'
import type { RouterContractClient } from '@orpc/contract'
import { contract } from '@hayasedb/contract'

export type ApiClient = JsonifiedClient<RouterContractClient<typeof contract>>

type ApiClientOptions = Pick<
  OpenAPILinkOptions<Record<never, never>>,
  'origin' | 'headers'
> & {
  onUnauthorized?: () => void
  onRateLimited?: () => void
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const { onUnauthorized, onRateLimited, ...linkOptions } = options

  const link = new OpenAPILink(contract, {
    url: '/api',
    ...linkOptions,
    interceptors: [
      onError((error) => {
        if (onUnauthorized && isUnauthorizedError(error)) onUnauthorized()
        if (onRateLimited && isRateLimitedError(error)) onRateLimited()
      }),
    ],
    fetch: (url, init) =>
      globalThis.fetch(url, { ...init, credentials: 'include' }),
  })

  return createORPCClient(link) as ApiClient
}
