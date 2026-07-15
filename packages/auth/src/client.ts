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

export type AdminUser = NonNullable<
  Awaited<ReturnType<AppAuthClient['admin']['listUsers']>>['data']
>['users'][number]

export type AdminUserSession = NonNullable<
  Awaited<ReturnType<AppAuthClient['admin']['listUserSessions']>>['data']
>['sessions'][number]

export interface AppAuthClientOptions {
  baseURL?: string
  fetchOptions?: FetchOptions
}

export function createAppAuthClient(
  options: AppAuthClientOptions = {},
): AppAuthClient {
  return createAuthClient({
    ...clientConfig,
    baseURL: options.baseURL,
    fetchOptions: { credentials: 'include', ...options.fetchOptions },
  }) as AppAuthClient
}
