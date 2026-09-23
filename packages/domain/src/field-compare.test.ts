import { describe, expect, it } from 'vitest'
import { ANIME_EPISODE_FIELD_META, ANIME_FIELD_META } from './field-meta'
import {
  changedFieldKeys,
  fieldIdentity,
  isEmptyValue,
  sameFieldValue,
} from './field-compare'

describe('isEmptyValue', () => {
  it.each([null, undefined, '', [], {}])('treats %o as empty', (value) => {
    expect(isEmptyValue(value)).toBe(true)
  })

  it.each([0, false, 'a', [0], { a: 1 }])('treats %o as not empty', (value) => {
    expect(isEmptyValue(value)).toBe(false)
  })
})

describe('sameFieldValue', () => {
  it('collapses every empty to one identity', () => {
    const empties = [null, undefined, '', [], {}]
    for (const a of empties) {
      for (const b of empties) expect(sameFieldValue(a, b)).toBe(true)
    }
  })

  it('keeps 0 and false distinct from empty', () => {
    expect(sameFieldValue(0, null)).toBe(false)
    expect(sameFieldValue(false, null)).toBe(false)
    expect(sameFieldValue(0, null, ANIME_EPISODE_FIELD_META.number)).toBe(false)
  })

  it('compares an ISO string against a FuzzyDate object', () => {
    const meta = ANIME_FIELD_META.startDate
    expect(
      sameFieldValue('1998-04-03', { year: 1998, month: 4, day: 3 }, meta),
    ).toBe(true)
    expect(
      sameFieldValue('1998-04-03', { year: 1998, month: 4, day: 4 }, meta),
    ).toBe(false)
  })

  it('distinguishes fuzzy dates by precision', () => {
    const meta = ANIME_FIELD_META.startDate
    expect(sameFieldValue({ year: 1998 }, { year: 1998, month: 4 }, meta)).toBe(
      false,
    )
  })

  it('ignores order for unordered fields', () => {
    const meta = ANIME_FIELD_META.genreIds
    expect(sameFieldValue(['a', 'b'], ['b', 'a'], meta)).toBe(true)
    expect(sameFieldValue(['a', 'b'], ['a', 'c'], meta)).toBe(false)
  })

  it('respects order for a plain array field', () => {
    expect(sameFieldValue(['a', 'b'], ['b', 'a'])).toBe(false)
  })

  it('strips positional keys from a singleton media list', () => {
    const meta = ANIME_FIELD_META.media
    const positional = meta.parts.positional
    expect(
      sameFieldValue(
        [{ type: 'COVER', mediaId: 'm1', position: 0 }],
        [{ type: 'COVER', mediaId: 'm1', position: 3 }],
        meta,
        positional,
      ),
    ).toBe(true)
  })

  it('keeps positional keys for a multi-item media list', () => {
    const meta = ANIME_FIELD_META.media
    const positional = meta.parts.positional
    const a = [
      { type: 'GALLERY', mediaId: 'm1', position: 0 },
      { type: 'GALLERY', mediaId: 'm2', position: 1 },
    ]
    const b = [
      { type: 'GALLERY', mediaId: 'm1', position: 1 },
      { type: 'GALLERY', mediaId: 'm2', position: 0 },
    ]
    expect(sameFieldValue(a, b, meta, positional)).toBe(false)
  })
})

describe('localized fields', () => {
  const meta = ANIME_FIELD_META.translations

  it('ignores locale order', () => {
    const a = [
      { locale: 'en', title: 'Cowboy Bebop', description: null },
      { locale: 'ja', title: 'カウボーイビバップ', description: null },
    ]
    const b = [a[1], a[0]]
    expect(sameFieldValue(a, b, meta)).toBe(true)
  })

  it('ignores rows that only carry a locale', () => {
    const a = [{ locale: 'en', title: 'Cowboy Bebop', description: null }]
    const b = [...a, { locale: 'ja', title: '', description: null }]
    expect(sameFieldValue(a, b, meta)).toBe(true)
  })

  it('detects an edited field', () => {
    const a = [{ locale: 'en', title: 'Cowboy Bebop', description: null }]
    const b = [{ locale: 'en', title: 'Kauboi Bibappu', description: null }]
    expect(sameFieldValue(a, b, meta)).toBe(false)
  })

  it('treats an all-empty list as empty', () => {
    expect(fieldIdentity([{ locale: 'en', title: '' }], meta)).toBe('null')
    expect(sameFieldValue([{ locale: 'en', title: '' }], null, meta)).toBe(true)
  })
})

describe('changedFieldKeys', () => {
  const order = ['slug', 'format', 'startDate', 'genreIds'] as const

  it('returns only the differing keys, in order', () => {
    const baseline = {
      slug: 'cowboy-bebop',
      format: 'TV',
      startDate: { year: 1998, month: 4, day: 3 },
      genreIds: ['a', 'b'],
    }
    const next = { ...baseline, genreIds: ['b', 'a'], slug: 'bebop' }
    expect(changedFieldKeys(next, baseline, ANIME_FIELD_META, order)).toEqual([
      'slug',
    ])
  })

  it('ignores an empty-to-empty transition', () => {
    expect(
      changedFieldKeys(
        { slug: '', format: null, startDate: {}, genreIds: [] },
        { slug: null, format: undefined, startDate: null, genreIds: undefined },
        ANIME_FIELD_META,
        order,
      ),
    ).toEqual([])
  })
})
