import { getRequestIP } from 'h3'
import { createAppAuthClient } from '@hayasedb/auth/client'

export default defineNuxtPlugin(() => {
  const { apiUrl } = useRuntimeConfig()
  const event = useRequestEvent()

  const headers: Record<string, string> = { ...useRequestHeaders(['cookie']) }
  const clientIp = event && getRequestIP(event, { xForwardedFor: true })
  if (clientIp) headers['x-forwarded-for'] = clientIp

  return {
    provide: {
      auth: createAppAuthClient({ baseURL: apiUrl, fetchOptions: { headers } }),
    },
  }
})
