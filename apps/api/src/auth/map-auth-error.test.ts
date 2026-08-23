import { ORPCError } from '@orpc/server'
import { APIError } from 'better-auth/api'
import { describe, expect, it } from 'vitest'
import { mapAuthError } from './map-auth-error'

describe('mapAuthError', () => {
  it('ignores errors that are not Better Auth API errors', () => {
    expect(mapAuthError(new Error('boom'))).toBeUndefined()
    expect(mapAuthError(new ORPCError('NOT_FOUND'))).toBeUndefined()
    expect(mapAuthError(null)).toBeUndefined()
  })

  it.each([
    ['BAD_REQUEST', 'BAD_REQUEST'],
    ['UNAUTHORIZED', 'UNAUTHORIZED'],
    ['FORBIDDEN', 'FORBIDDEN'],
    ['NOT_FOUND', 'NOT_FOUND'],
    ['CONFLICT', 'CONFLICT'],
    ['UNPROCESSABLE_ENTITY', 'UNPROCESSABLE_CONTENT'],
    ['TOO_MANY_REQUESTS', 'TOO_MANY_REQUESTS'],
  ] as const)('maps status %s to %s', (status, code) => {
    const mapped = mapAuthError(new APIError(status, { message: 'm' }))
    expect(mapped).toBeInstanceOf(ORPCError)
    expect(mapped?.code).toBe(code)
    expect(mapped?.message).toBe('m')
  })

  it.each([
    ['USER_ALREADY_EXISTS', 'UNPROCESSABLE_ENTITY', 'CONFLICT'],
    [
      'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
      'UNPROCESSABLE_ENTITY',
      'CONFLICT',
    ],
    ['PASSWORD_ALREADY_SET', 'BAD_REQUEST', 'CONFLICT'],
    ['FAILED_TO_UNLINK_LAST_ACCOUNT', 'BAD_REQUEST', 'CONFLICT'],
    ['EMAIL_ALREADY_VERIFIED', 'BAD_REQUEST', 'CONFLICT'],
    ['INVALID_TOKEN', 'UNAUTHORIZED', 'BAD_REQUEST'],
    ['INVALID_EMAIL_OR_PASSWORD', 'UNAUTHORIZED', 'UNAUTHORIZED'],
    ['BANNED_USER', 'UNAUTHORIZED', 'FORBIDDEN'],
    ['INVALID_API_KEY', 'FORBIDDEN', 'UNAUTHORIZED'],
  ] as const)('overrides %s regardless of status', (authCode, status, code) => {
    const mapped = mapAuthError(
      new APIError(status, { code: authCode, message: 'm' }),
    )
    expect(mapped?.code).toBe(code)
  })

  it('hides unmapped statuses behind INTERNAL_SERVER_ERROR', () => {
    const mapped = mapAuthError(
      new APIError('INTERNAL_SERVER_ERROR', { message: 'db down' }),
    )
    expect(mapped?.code).toBe('INTERNAL_SERVER_ERROR')
    expect(mapped?.message).not.toContain('db down')
  })
})
