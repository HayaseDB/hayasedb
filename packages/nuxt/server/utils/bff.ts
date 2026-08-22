import type { H3Event } from 'h3'
import type { BffAudience } from '@hayasedb/contract'
import {
  API_KEY_HEADER,
  INTERNAL_TOKEN_HEADER,
  createBffMatcher,
} from '@hayasedb/contract'

const UNTRUSTED_HEADERS = new Set([
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-forwarded-for',
  API_KEY_HEADER,
  INTERNAL_TOKEN_HEADER,
])

export interface BffProfile {
  audience: BffAudience
  allows(method: string, pathname: string): boolean
}

function createProfile(audience: BffAudience): BffProfile {
  const matcher = createBffMatcher(audience)

  return {
    audience,
    allows: (method, pathname) =>
      pathname.startsWith('/api/') &&
      matcher.matches(method, pathname.slice(4)),
  }
}

const PROFILES: Record<BffAudience, BffProfile> = {
  web: createProfile('web'),
  admin: createProfile('admin'),
}

export const resolveBffProfile = (name: string): BffProfile =>
  PROFILES[name === 'admin' ? 'admin' : 'web']

export function prepareProxyHeaders(
  event: H3Event,
  internalToken: string,
): Record<string, string> {
  const clientIp = getRequestIP(event, { xForwardedFor: true })

  event.node.req.headers = Object.fromEntries(
    Object.entries(event.node.req.headers).filter(
      ([name]) => !UNTRUSTED_HEADERS.has(name),
    ),
  )

  const headers: Record<string, string> = {}
  if (clientIp) headers['x-forwarded-for'] = clientIp
  if (internalToken) headers[INTERNAL_TOKEN_HEADER] = internalToken
  return headers
}
