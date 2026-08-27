import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { SkipThrottle } from '@nestjs/throttler'
import { API_KEY_HEADER, INTERNAL_TOKEN_HEADER } from '@hayasedb/contract'
import type { Request } from 'express'
import { describe, expect, it } from 'vitest'
import {
  ApiAccessGuard,
  OPEN_ENDPOINT,
  OpenEndpoint,
  getApiKey,
} from './api-access.guard'

const TOKEN_A = 'a'.repeat(32)
const TOKEN_B = 'b'.repeat(32)

function createGuard(tokens: string[], open = false) {
  const config = new ConfigService({ INTERNAL_API_TOKEN: tokens })
  const reflector = {
    getAllAndOverride: () => open,
  } as unknown as Reflector
  return new ApiAccessGuard(config as never, reflector)
}

function contextFor(
  request: Partial<Request> & { headers?: Record<string, unknown> },
): { context: ExecutionContext; request: Request } {
  const req = {
    method: 'GET',
    headers: {},
    ...request,
  } as unknown as Request
  const context = {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext
  return { context, request: req }
}

describe('getApiKey', () => {
  it('returns the header value and treats an empty string as absent', () => {
    expect(getApiKey({ headers: { [API_KEY_HEADER]: 'k' } } as never)).toBe('k')
    expect(getApiKey({ headers: { [API_KEY_HEADER]: '' } } as never)).toBe(
      undefined,
    )
    expect(getApiKey({ headers: {} } as never)).toBe(undefined)
  })

  it('takes the first value when the header is repeated', () => {
    expect(
      getApiKey({
        headers: { [API_KEY_HEADER]: ['first', 'second'] },
      } as never),
    ).toBe('first')
  })
})

describe('internal request detection', () => {
  it('treats every request as internal when no token is configured', () => {
    const guard = createGuard([])
    const { context, request } = contextFor({})
    expect(guard.canActivate(context)).toBe(true)
    expect(request.internal).toBe(true)
    expect(request.apiKeyAuth).toBe(false)
  })

  it('accepts any of the configured tokens', () => {
    const guard = createGuard([TOKEN_A, TOKEN_B])
    for (const token of [TOKEN_A, TOKEN_B]) {
      const { context, request } = contextFor({
        headers: { [INTERNAL_TOKEN_HEADER]: token },
      })
      expect(guard.canActivate(context)).toBe(true)
      expect(request.internal).toBe(true)
    }
  })

  it('rejects a token with a different length without throwing', () => {
    const guard = createGuard([TOKEN_A])
    const { context, request } = contextFor({
      headers: { [INTERNAL_TOKEN_HEADER]: TOKEN_A.slice(0, 31) },
    })
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
    expect(request.internal).toBe(false)
  })

  it('rejects a wrong token of the same length', () => {
    const guard = createGuard([TOKEN_A])
    const { context } = contextFor({
      headers: { [INTERNAL_TOKEN_HEADER]: TOKEN_B },
    })
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('uses the first value of a repeated internal token header', () => {
    const guard = createGuard([TOKEN_A])
    const { context } = contextFor({
      headers: { [INTERNAL_TOKEN_HEADER]: [TOKEN_B, TOKEN_A] },
    })
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })
})

describe('API key access', () => {
  it('reports a missing key with the MISSING_API_KEY code', () => {
    const guard = createGuard([TOKEN_A])
    const { context } = contextFor({ route: { path: '/api/anime' } as never })
    let caught: unknown
    try {
      guard.canActivate(context)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(UnauthorizedException)
    expect((caught as UnauthorizedException).getResponse()).toMatchObject({
      code: 'MISSING_API_KEY',
    })
  })

  it.each([
    ['GET', '/api/anime'],
    ['HEAD', '/api/anime'],
    ['GET', '/api/anime/:id'],
    ['GET', '/api/genres'],
    ['GET', '/api/genres/:id'],
    ['GET', '/api/stats'],
    ['GET', '/api/version'],
  ])('allows %s %s with a key', (method, path) => {
    const guard = createGuard([TOKEN_A])
    const { context, request } = contextFor({
      method,
      route: { path } as never,
      headers: { [API_KEY_HEADER]: 'hyd_key' },
    })
    expect(guard.canActivate(context)).toBe(true)
    expect(request.apiKeyAuth).toBe(true)
    expect(request.internal).toBe(false)
  })

  it.each([
    ['POST', '/api/anime'],
    ['PATCH', '/api/anime/:id'],
    ['DELETE', '/api/anime/:id'],
    ['DELETE', '/api/genres/:id'],
    ['GET', '/api/auth/get-session'],
    ['GET', '/api/auth/admin/list-users'],
    ['POST', '/api/contributions'],
  ])('forbids %s %s with a key', (method, path) => {
    const guard = createGuard([TOKEN_A])
    const { context } = contextFor({
      method,
      route: { path } as never,
      headers: { [API_KEY_HEADER]: 'hyd_key' },
    })
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
  })

  it('forbids a keyed request when the route path is unknown', () => {
    const guard = createGuard([TOKEN_A])
    const { context } = contextFor({
      headers: { [API_KEY_HEADER]: 'hyd_key' },
    })
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException)
  })

  it('lets an internal request use a key on any route', () => {
    const guard = createGuard([TOKEN_A])
    const { context, request } = contextFor({
      method: 'POST',
      route: { path: '/api/anime' } as never,
      headers: {
        [API_KEY_HEADER]: 'hyd_key',
        [INTERNAL_TOKEN_HEADER]: TOKEN_A,
      },
    })
    expect(guard.canActivate(context)).toBe(true)
    expect(request.apiKeyAuth).toBe(true)
  })
})

describe('OpenEndpoint', () => {
  it('bypasses the key requirement but still marks the request', () => {
    const guard = createGuard([TOKEN_A], true)
    const { context, request } = contextFor({})
    expect(guard.canActivate(context)).toBe(true)
    expect(request.internal).toBe(false)
    expect(request.apiKeyAuth).toBe(false)
  })

  it('marks the handler open and skips throttling exactly like SkipThrottle()', () => {
    class Target {
      @OpenEndpoint()
      handler() {}
    }
    class Reference {
      @SkipThrottle()
      handler() {}
    }
    const reflector = new Reflector()
    const handler = Target.prototype.handler
    const reference = Reference.prototype.handler
    expect(reflector.get(OPEN_ENDPOINT, handler)).toBe(true)
    const skipKeys = Reflect.getMetadataKeys(reference)
    expect(skipKeys.length).toBeGreaterThan(0)
    for (const key of skipKeys) {
      expect(Reflect.getMetadata(key, handler)).toEqual(
        Reflect.getMetadata(key, reference),
      )
    }
  })
})
