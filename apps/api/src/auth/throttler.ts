import { createHash } from 'node:crypto'
import type { ExecutionContext } from '@nestjs/common'
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler'
import { Throttle } from '@nestjs/throttler'
import type { Request } from 'express'
import { getApiKey, hasApiKey } from './api-access.guard'

const IP_LIMIT = 600
const API_KEY_LIMIT = 60
const TTL = 60_000

const requestOf = (context: ExecutionContext): Request =>
  context.switchToHttp().getRequest<Request>()

const fingerprint = (value: string) =>
  createHash('sha256').update(value).digest('hex').slice(0, 32)

export const throttlerOptions = (
  storage: ThrottlerStorage,
): ThrottlerModuleOptions => ({
  storage,
  errorMessage: 'Too many requests',
  throttlers: [
    {
      ttl: TTL,
      limit: (context) =>
        hasApiKey(requestOf(context)) ? API_KEY_LIMIT : IP_LIMIT,
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
