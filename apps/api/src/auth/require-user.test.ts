import { ORPCError } from '@orpc/server'
import { describe, expect, it } from 'vitest'
import type { ORPCContext } from '../orpc/context'
import {
  isAdminRequest,
  requireAdminUser,
  requireVerifiedUser,
} from './require-user'

type User = NonNullable<ORPCContext['request']['user']>

function contextWith(
  user: Partial<User> | null,
  apiKeyAuth = false,
): ORPCContext {
  return {
    request: { user, apiKeyAuth } as ORPCContext['request'],
  }
}

const verified: Partial<User> = {
  id: 'u1',
  emailVerified: true,
  banned: false,
  role: 'user',
}

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (error) {
    return error instanceof ORPCError ? error.code : undefined
  }
  return undefined
}

describe('requireVerifiedUser', () => {
  it('returns the user id for a verified, unbanned user', () => {
    expect(requireVerifiedUser(contextWith(verified))).toBe('u1')
  })

  it.each([
    ['anonymous', null, 'UNAUTHORIZED'],
    ['user without id', { ...verified, id: '' }, 'UNAUTHORIZED'],
    ['banned user', { ...verified, banned: true }, 'FORBIDDEN'],
    ['unverified user', { ...verified, emailVerified: false }, 'FORBIDDEN'],
  ])('rejects %s', (_label, user, code) => {
    expect(codeOf(() => requireVerifiedUser(contextWith(user)))).toBe(code)
  })

  it('reports the ban before the missing verification', () => {
    expect(() =>
      requireVerifiedUser(
        contextWith({ ...verified, banned: true, emailVerified: false }),
      ),
    ).toThrow('Account is banned')
  })
})

describe('isAdminRequest', () => {
  it('requires the admin role and a session, never an API key', () => {
    expect(isAdminRequest(contextWith({ role: 'admin' }).request)).toBe(true)
    expect(isAdminRequest(contextWith({ role: 'admin' }, true).request)).toBe(
      false,
    )
    expect(isAdminRequest(contextWith({ role: 'user' }).request)).toBe(false)
    expect(isAdminRequest(contextWith(null).request)).toBe(false)
  })
})

describe('requireAdminUser', () => {
  it('returns the id for a verified admin session', () => {
    expect(requireAdminUser(contextWith({ ...verified, role: 'admin' }))).toBe(
      'u1',
    )
  })

  it('rejects a verified non-admin with FORBIDDEN', () => {
    expect(codeOf(() => requireAdminUser(contextWith(verified)))).toBe(
      'FORBIDDEN',
    )
  })

  it('rejects an admin authenticated through an API key', () => {
    expect(
      codeOf(() =>
        requireAdminUser(contextWith({ ...verified, role: 'admin' }, true)),
      ),
    ).toBe('FORBIDDEN')
  })

  it('still reports UNAUTHORIZED for anonymous callers', () => {
    expect(codeOf(() => requireAdminUser(contextWith(null)))).toBe(
      'UNAUTHORIZED',
    )
  })
})
