import { createHash } from 'node:crypto'
import { getCachePolicy } from '@hayasedb/contract'
import type { CachePolicy } from '@hayasedb/contract'
import type { Request } from 'express'

export const VARY_VALUE = 'Accept-Encoding, X-Api-Key'

export function buildCacheControl(policy: CachePolicy): string {
  const directives = [`public`, `max-age=${policy.maxAge}`]
  if (policy.staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${policy.staleWhileRevalidate}`)
  }
  return directives.join(', ')
}

export function computeETag(body: unknown): string | undefined {
  if (body === undefined) return undefined
  const hash = createHash('sha1')
    .update(JSON.stringify(body))
    .digest('base64url')
  return `"${hash}"`
}

export function isFreshRequest(
  request: Request,
  etag: string | undefined,
): boolean {
  if (!etag) return false
  const header: string | string[] | undefined = request.headers['if-none-match']
  const value: string | undefined = Array.isArray(header) ? header[0] : header
  if (!value) return false

  return value
    .split(',')
    .map((candidate) => candidate.trim().replace(/^W\//, ''))
    .some((candidate) => candidate === etag || candidate === '*')
}

export { getCachePolicy }
