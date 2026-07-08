import { createAppAuthClient } from '@hayasedb/auth/client'

export function useAuth() {
  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const baseURL = `${useRequestURL().origin}/api/auth`

  return createAppAuthClient(baseURL, { headers })
}
