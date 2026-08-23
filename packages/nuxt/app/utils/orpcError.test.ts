import { describe, expect, it } from 'vitest'
import {
  isConflictError,
  isRateLimitedError,
  isUnauthorizedError,
  orpcErrorMessage,
} from './orpcError'

describe('orpcError helpers', () => {
  it('matches codes only on objects with a string code', () => {
    expect(isConflictError({ code: 'CONFLICT' })).toBe(true)
    expect(isConflictError({ code: 'UNAUTHORIZED' })).toBe(false)
    expect(isConflictError({ code: 409 })).toBe(false)
    expect(isConflictError('CONFLICT')).toBe(false)
    expect(isConflictError(null)).toBe(false)
    expect(isUnauthorizedError({ code: 'UNAUTHORIZED' })).toBe(true)
    expect(isUnauthorizedError(new Error('UNAUTHORIZED'))).toBe(false)
  })

  it('treats both the oRPC code and a raw 429 status as rate limiting', () => {
    expect(isRateLimitedError({ code: 'TOO_MANY_REQUESTS' })).toBe(true)
    expect(isRateLimitedError({ status: 429 })).toBe(true)
    expect(isRateLimitedError({ status: '429' })).toBe(false)
    expect(isRateLimitedError({ code: 'BAD_REQUEST', status: 400 })).toBe(false)
    expect(isRateLimitedError(undefined)).toBe(false)
  })

  it('extracts non-empty string messages only', () => {
    expect(orpcErrorMessage(new Error('boom'))).toBe('boom')
    expect(orpcErrorMessage({ message: '' })).toBeUndefined()
    expect(orpcErrorMessage({ message: 12 })).toBeUndefined()
    expect(orpcErrorMessage('boom')).toBeUndefined()
  })
})
