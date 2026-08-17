import { getRequestIP } from 'h3'
import { INTERNAL_TOKEN_HEADER } from '@hayasedb/contract'

export function useInternalApiHeaders(): Record<string, string> {
  const { internalToken } = useRuntimeConfig()
  const event = useRequestEvent()

  const headers: Record<string, string> = { ...useRequestHeaders(['cookie']) }
  const clientIp = event && getRequestIP(event, { xForwardedFor: true })
  if (clientIp) headers['x-forwarded-for'] = clientIp
  if (internalToken) headers[INTERNAL_TOKEN_HEADER] = internalToken
  return headers
}
