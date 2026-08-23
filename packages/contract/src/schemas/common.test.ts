import { describe, expect, it } from 'vitest'
import { idSchema, paginationInputSchema, queryBooleanSchema } from './common'

describe('idSchema', () => {
  it('lowercases a valid uuid and rejects other strings', () => {
    const upper = '0195A1B2-C3D4-7E5F-8A9B-0C1D2E3F4A5B'
    expect(idSchema.parse(upper)).toBe(upper.toLowerCase())
    expect(idSchema.safeParse('not-a-uuid').success).toBe(false)
    expect(idSchema.safeParse('').success).toBe(false)
  })
})

describe('queryBooleanSchema', () => {
  it.each([
    [true, true],
    [false, false],
    ['true', true],
    ['false', false],
    ['1', true],
    ['0', false],
    ['yes', true],
    ['no', false],
  ])('%j => %j', (input, expected) => {
    expect(queryBooleanSchema.parse(input)).toBe(expected)
  })

  it('rejects arbitrary strings', () => {
    expect(queryBooleanSchema.safeParse('maybe').success).toBe(false)
    expect(queryBooleanSchema.safeParse('').success).toBe(false)
  })
})

describe('paginationInputSchema', () => {
  it('applies defaults and coerces query strings', () => {
    expect(paginationInputSchema.parse({})).toEqual({ limit: 20, offset: 0 })
    expect(paginationInputSchema.parse({ limit: '5', offset: '10' })).toEqual({
      limit: 5,
      offset: 10,
    })
  })

  it.each([
    [{ limit: 0 }],
    [{ limit: 101 }],
    [{ limit: 1.5 }],
    [{ offset: -1 }],
    [{ limit: 'abc' }],
  ])('rejects %j', (input) => {
    expect(paginationInputSchema.safeParse(input).success).toBe(false)
  })
})
