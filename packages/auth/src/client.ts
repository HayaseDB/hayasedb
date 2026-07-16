import { createAuthClient } from 'better-auth/vue'
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins'
import type { Auth } from './auth'

type ClientOptions = NonNullable<Parameters<typeof createAuthClient>[0]>
type FetchOptions = ClientOptions['fetchOptions']

type ErrorContext = Parameters<
  NonNullable<NonNullable<FetchOptions>['onError']>
>[0]

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

const EXPECTED_401_PATHS = ['/sign-in', '/sign-up', '/sign-out', '/get-session']

function isExpected401(url: string | URL): boolean {
  const { pathname } =
    url instanceof URL ? url : new URL(url, 'http://localhost')
  return EXPECTED_401_PATHS.some((path) => pathname.includes(path))
}

export interface AppAuthClientOptions {
  baseURL?: string
  fetchOptions?: FetchOptions
  onUnauthorized?: () => void
}

export function createAppAuthClient(
  options: AppAuthClientOptions = {},
): AppAuthClient {
  const { onUnauthorized } = options

  return createAuthClient({
    ...clientConfig,
    baseURL: options.baseURL,
    fetchOptions: {
      credentials: 'include',
      ...(onUnauthorized && {
        onError(context: ErrorContext) {
          if (
            context.response.status === 401 &&
            !isExpected401(context.request.url)
          ) {
            onUnauthorized()
          }
        },
      }),
      ...options.fetchOptions,
    },
  }) as AppAuthClient
}
