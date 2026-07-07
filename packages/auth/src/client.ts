import { createAuthClient } from 'better-auth/vue'
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins'
import type { Auth } from './auth'

type ClientOptions = NonNullable<Parameters<typeof createAuthClient>[0]>
type FetchOptions = ClientOptions['fetchOptions']

const clientConfig = {
  plugins: [adminClient(), inferAdditionalFields<Auth>()],
}

export type AppAuthClient = ReturnType<
  typeof createAuthClient<typeof clientConfig>
>

export function createAppAuthClient(
  baseURL: string,
  fetchOptions?: FetchOptions,
): AppAuthClient {
  return createAuthClient({
    ...clientConfig,
    baseURL,
    fetchOptions: { credentials: 'include', ...fetchOptions },
  }) as AppAuthClient
}
