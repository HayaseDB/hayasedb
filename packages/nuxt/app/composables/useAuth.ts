import type { AppAuthClient } from '@hayasedb/auth'

export function useAuth(): AppAuthClient {
  return useNuxtApp().$auth
}
