import type { ExecutionContext } from '@nestjs/common'
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'
import { getApiKey } from './api-access.guard'
import { fingerprint, type KeyLimitCache } from './key-limit-cache'

const IP_LIMIT = 600
const API_KEY_LIMIT = 60
const TTL = 60_000

const requestOf = (context: ExecutionContext): Request =>
  context.switchToHttp().getRequest<Request>()

export { fingerprint }

async function resolveLimit(
  context: ExecutionContext,
  keyLimits: KeyLimitCache | undefined,
): Promise<number> {
  const request = requestOf(context)
  const apiKey = getApiKey(request)
  if (!apiKey) return IP_LIMIT
  if (!keyLimits) return API_KEY_LIMIT

  const cached = await keyLimits.get(apiKey)
  if (!cached || cached.max === null) return API_KEY_LIMIT

  const scaled = Math.round((cached.max * TTL) / cached.windowMs)
  return Math.max(1, scaled)
}

export const throttlerOptions = (
  storage: ThrottlerStorage,
  keyLimits?: KeyLimitCache,
): ThrottlerModuleOptions => ({
  storage,
  errorMessage: 'Too many requests',
  throttlers: [
    {
      ttl: TTL,
      limit: (context) => resolveLimit(context, keyLimits),
      skipIf: (context) => context.getType() !== 'http',
      getTracker: (_request, context) => {
        const request = requestOf(context)
        const apiKey = getApiKey(request)
        return apiKey
          ? `key:${fingerprint(apiKey)}`
          : `ip:${request.ip ?? 'unknown'}`
      },
      generateKey: (_context, tracker) => tracker,
    },
  ],
})

export const RouteThrottle = (limit: number) =>
  Throttle({
    default: {
      limit,
      ttl: TTL,
      generateKey: (context, tracker) =>
        `${context.getClass().name}:${context.getHandler().name}:${tracker}`,
    },
  })
