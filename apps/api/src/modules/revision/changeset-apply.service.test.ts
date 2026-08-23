import { describe, expect, it } from 'vitest'
import { isUniqueViolation } from './changeset-apply.service'

describe('isUniqueViolation', () => {
  it('detects the postgres unique violation code directly and through causes', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
    expect(
      isUniqueViolation(new Error('wrap', { cause: { code: '23505' } })),
    ).toBe(true)
    expect(
      isUniqueViolation(
        new Error('a', { cause: new Error('b', { cause: { code: '23505' } }) }),
      ),
    ).toBe(true)
  })

  it('rejects other codes, non-objects and overly deep chains', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
    expect(isUniqueViolation('23505')).toBe(false)
    let deep: unknown = { code: '23505' }
    for (let i = 0; i < 5; i += 1) deep = { cause: deep }
    expect(isUniqueViolation(deep)).toBe(false)
  })
})
