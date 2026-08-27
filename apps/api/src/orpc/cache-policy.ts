import type { StandardHandlerInterceptor } from '@orpc/server/standard'
import { getCachePolicy } from '@hayasedb/contract'
import type { ORPCContext } from './context'
import {
  VARY_VALUE,
  buildCacheControl,
  computeETag,
} from '../http/cache-headers'

export const applyCachePolicy: StandardHandlerInterceptor<ORPCContext> = async (
  options,
) => {
  const response = await options.next()

  const resHeaders = options.context.resHeaders
  if (!resHeaders) return response

  const policy = getCachePolicy(options.procedure)
  if (!policy) return response

  const method = options.request.method
  if (method !== 'GET' && method !== 'HEAD') return response
  if (response.status !== 200) return response

  resHeaders.set('cache-control', buildCacheControl(policy))
  resHeaders.set('vary', VARY_VALUE)

  const etag = computeETag(response.body)
  if (etag) resHeaders.set('etag', etag)

  return response
}
