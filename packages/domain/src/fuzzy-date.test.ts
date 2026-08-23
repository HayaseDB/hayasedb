import { describe, expect, it } from 'vitest'
import { fc, test } from '@fast-check/vitest'
import {
  daysInMonth,
  formatFuzzyDate,
  fuzzyDateEquals,
  fuzzyFromParts,
  isoToFuzzy,
} from './fuzzy-date'

describe('daysInMonth', () => {
  it.each([
    [2024, 2, 29],
    [2023, 2, 28],
    [2000, 2, 29],
    [1900, 2, 28],
    [2024, 4, 30],
    [2024, 12, 31],
  ])('%i-%i has %i days', (year, month, days) => {
    expect(daysInMonth(year, month)).toBe(days)
  })
})

describe('isoToFuzzy', () => {
  it('parses every precision', () => {
    expect(isoToFuzzy('1999')).toEqual({ year: 1999, month: null, day: null })
    expect(isoToFuzzy('1999-04')).toEqual({ year: 1999, month: 4, day: null })
    expect(isoToFuzzy('1999-04-07')).toEqual({ year: 1999, month: 4, day: 7 })
  })
})

describe('formatFuzzyDate', () => {
  it('renders by precision', () => {
    expect(formatFuzzyDate(null)).toBe('')
    expect(formatFuzzyDate({ year: 1999, month: null, day: null })).toBe('1999')
    expect(formatFuzzyDate({ year: 1999, month: 4, day: null })).toBe(
      'Apr 1999',
    )
    expect(formatFuzzyDate({ year: 1999, month: 4, day: 7 })).toBe(
      'Apr 7, 1999',
    )
  })
})

describe('fuzzyFromParts', () => {
  it('returns null without a year', () => {
    expect(fuzzyFromParts(null, 4, 7)).toBeNull()
    expect(fuzzyFromParts(1999, null, null)).toEqual({
      year: 1999,
      month: null,
      day: null,
    })
  })
})

describe('fuzzyDateEquals', () => {
  const a = { year: 1999, month: 4, day: null }

  it('treats both empty as equal and one empty as different', () => {
    expect(fuzzyDateEquals(null, undefined)).toBe(true)
    expect(fuzzyDateEquals(a, null)).toBe(false)
  })

  it('distinguishes precision', () => {
    expect(fuzzyDateEquals(a, { ...a, day: 1 })).toBe(false)
    expect(fuzzyDateEquals(a, { ...a })).toBe(true)
  })

  const fuzzy = fc
    .record({
      year: fc.integer({ min: 1900, max: 2100 }),
      month: fc.option(fc.integer({ min: 1, max: 12 }), { nil: null }),
      day: fc.option(fc.integer({ min: 1, max: 28 }), { nil: null }),
    })
    .map((d) => (d.month === null ? { ...d, day: null } : d))

  test.prop([fuzzy, fuzzy])('is symmetric', (x, y) => {
    expect(fuzzyDateEquals(x, y)).toBe(fuzzyDateEquals(y, x))
  })

  test.prop([fuzzy])('round trips through iso text', (d) => {
    const iso = [d.year, d.month, d.day]
      .filter((part) => part !== null)
      .map((part) => String(part).padStart(2, '0'))
      .join('-')
    expect(fuzzyDateEquals(isoToFuzzy(iso), d)).toBe(true)
  })
})
