import { ORPCError } from '@orpc/server'
import { describe, expect, it } from 'vitest'
import {
  asDocument,
  assertOwnerOrAdmin,
  assertPending,
} from './changeset-guards'

function codeOf(fn: () => unknown) {
  try {
    fn()
  } catch (error) {
    if (error instanceof ORPCError)
      return { code: error.code, message: error.message }
    throw error
  }
  return undefined
}

describe('asDocument', () => {
  it('returns objects unchanged and anything else as an empty document', () => {
    const doc = { a: 1 }
    expect(asDocument(doc)).toBe(doc)
    expect(asDocument(null)).toEqual({})
    expect(asDocument('x')).toEqual({})
    expect(asDocument(undefined)).toEqual({})
  })
})

describe('assertPending', () => {
  it('passes for pending and reports the actual status otherwise', () => {
    expect(() => assertPending({ status: 'pending' })).not.toThrow()
    expect(codeOf(() => assertPending({ status: 'approved' }))).toEqual({
      code: 'CONFLICT',
      message: 'Contribution is already approved',
    })
    expect(codeOf(() => assertPending({ status: 'rejected' }))?.code).toBe(
      'CONFLICT',
    )
  })
})

describe('assertOwnerOrAdmin', () => {
  it('allows the author and any admin, hides the row from everyone else', () => {
    expect(() =>
      assertOwnerOrAdmin({ authorId: 'u1' }, 'u1', false),
    ).not.toThrow()
    expect(() =>
      assertOwnerOrAdmin({ authorId: 'u1' }, 'u2', true),
    ).not.toThrow()
    expect(
      codeOf(() => assertOwnerOrAdmin({ authorId: 'u1' }, 'u2', false))?.code,
    ).toBe('NOT_FOUND')
  })
})
