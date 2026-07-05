import { createAuthClient } from 'better-auth/vue'
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins'
import type { Auth } from './auth'

export function createAppAuthClient(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [adminClient(), inferAdditionalFields<Auth>()],
  })
}

export type AppAuthClient = ReturnType<typeof createAppAuthClient>
