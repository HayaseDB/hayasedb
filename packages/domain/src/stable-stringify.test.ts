import { describe, expect, it } from 'vitest'
import { fc, test } from '@fast-check/vitest'
import { stableStringify, unorderedStringify } from './stable-stringify'

const json = fc.jsonValue({ maxDepth: 4 })

function shuffleKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(shuffleKeys)
  const entries = Object.entries(value as Record<string, unknown>).reverse()
  return Object.fromEntries(entries.map(([k, v]) => [k, shuffleKeys(v)]))
}

describe('stableStringify', () => {
  it('sorts object keys', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
  })

  it('preserves array order', () => {
    expect(stableStringify([2, 1])).toBe('[2,1]')
  })

  it('drops undefined values and keeps null', () => {
    expect(stableStringify({ a: undefined, b: null })).toBe('{"b":null}')
  })

  it('serializes undefined at the top level as null', () => {
    expect(stableStringify(undefined)).toBe('null')
  })

  test.prop([json])('is independent of key insertion order', (value) => {
    expect(stableStringify(shuffleKeys(value))).toBe(stableStringify(value))
  })

  test.prop([json])('round trips through JSON.parse', (value) => {
    expect(JSON.parse(stableStringify(value))).toEqual(
      JSON.parse(JSON.stringify(value)),
    )
  })
})

describe('unorderedStringify', () => {
  it('treats arrays as multisets', () => {
    expect(unorderedStringify({ x: [2, 1] })).toBe(
      unorderedStringify({ x: [1, 2] }),
    )
    expect(unorderedStringify([1, 1])).not.toBe(unorderedStringify([1]))
  })

  test.prop([fc.array(json)])('is independent of array order', (items) => {
    expect(unorderedStringify([...items].reverse())).toBe(
      unorderedStringify(items),
    )
  })
})
