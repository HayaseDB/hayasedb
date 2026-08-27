import { ANIME_SORT_KEYS } from '@hayasedb/domain'
import { describe, expect, it } from 'vitest'
import {
  animeDocumentMediaListSchema,
  animeDocumentRelationListSchema,
  animeSortFieldSchema,
  animeTitleFieldSchema,
  createAnimeInputSchema,
  fuzzyDateSchema,
  listAnimeInputSchema,
  parseAnimeSort,
  releaseDateSchema,
  slugSchema,
  sortOrderSchema,
} from './anime'

const uuid = (n: number) => `0195a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5${n}`

describe('slugSchema', () => {
  it.each(['a', 'cowboy-bebop', 'a1-b2-c3', ' trimmed '])('accepts %j', (s) => {
    expect(slugSchema.safeParse(s).success).toBe(true)
  })

  it.each([
    '',
    'Cowboy-Bebop',
    'cowboy--bebop',
    '-cowboy',
    'cowboy-',
    'cowboy bebop',
    'cowboy_bebop',
    'ünicode',
    'a'.repeat(121),
  ])('rejects %j', (s) => {
    expect(slugSchema.safeParse(s).success).toBe(false)
  })
})

describe('fuzzyDateSchema', () => {
  it('normalises missing parts to null', () => {
    expect(fuzzyDateSchema.parse({ year: 1998 })).toEqual({
      year: 1998,
      month: null,
      day: null,
    })
  })

  it('rejects a day without a month', () => {
    const result = fuzzyDateSchema.safeParse({ year: 1998, day: 3 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['day'])
  })

  it('rejects a day that does not exist in that month', () => {
    expect(
      fuzzyDateSchema.safeParse({ year: 2023, month: 2, day: 29 }).success,
    ).toBe(false)
    expect(
      fuzzyDateSchema.safeParse({ year: 2024, month: 2, day: 29 }).success,
    ).toBe(true)
  })

  it('rejects out of range month and day', () => {
    expect(fuzzyDateSchema.safeParse({ year: 2024, month: 13 }).success).toBe(
      false,
    )
    expect(
      fuzzyDateSchema.safeParse({ year: 2024, month: 1, day: 32 }).success,
    ).toBe(false)
  })
})

describe('releaseDateSchema', () => {
  it('accepts fuzzy objects, iso strings, blanks and null', () => {
    expect(releaseDateSchema.parse({ year: 1998, month: 4 })).toEqual({
      year: 1998,
      month: 4,
      day: null,
    })
    expect(releaseDateSchema.parse('1998-04-03')).toEqual({
      year: 1998,
      month: 4,
      day: 3,
    })
    expect(releaseDateSchema.parse('  ')).toBeNull()
    expect(releaseDateSchema.parse(null)).toBeNull()
    expect(releaseDateSchema.parse(undefined)).toBeUndefined()
  })

  it('rejects partial iso strings and invalid dates', () => {
    expect(releaseDateSchema.safeParse('1998-04').success).toBe(false)
    expect(releaseDateSchema.safeParse('1998-02-30').success).toBe(false)
  })
})

describe('animeTitleFieldSchema', () => {
  it('turns blank into null and trims', () => {
    expect(animeTitleFieldSchema.parse('   ')).toBeNull()
    expect(animeTitleFieldSchema.parse(' Bebop ')).toBe('Bebop')
    expect(animeTitleFieldSchema.safeParse('x'.repeat(256)).success).toBe(false)
  })
})

describe('animeDocumentRelationListSchema', () => {
  it('rejects the same target and kind twice but allows different kinds', () => {
    const dup = [
      { targetId: uuid(1), kind: 'SEQUEL' },
      { targetId: uuid(1), kind: 'SEQUEL' },
    ]
    const mixed = [
      { targetId: uuid(1), kind: 'SEQUEL' },
      { targetId: uuid(1), kind: 'OTHER' },
    ]
    expect(animeDocumentRelationListSchema.safeParse(dup).success).toBe(false)
    expect(animeDocumentRelationListSchema.safeParse(mixed).success).toBe(true)
  })

  it('caps at 50 relations', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({
      targetId: `0195a1b2-c3d4-7e5f-8a9b-${String(i).padStart(12, '0')}`,
      kind: 'OTHER',
    }))
    expect(animeDocumentRelationListSchema.safeParse(many).success).toBe(false)
  })
})

describe('animeDocumentMediaListSchema', () => {
  const item = (type: string, position: number) => ({
    mediaId: uuid(position),
    type,
    position,
  })

  it('allows one cover and one banner', () => {
    expect(
      animeDocumentMediaListSchema.safeParse([
        item('COVER', 0),
        item('BANNER', 1),
      ]).success,
    ).toBe(true)
  })

  it.each(['COVER', 'BANNER'])('rejects two %s items', (type) => {
    const result = animeDocumentMediaListSchema.safeParse([
      item(type, 0),
      item(type, 1),
    ])
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(`Only one ${type} allowed`)
  })
})

describe('createAnimeInputSchema', () => {
  it('accepts a minimal document and lowercases genre ids', () => {
    const parsed = createAnimeInputSchema.parse({
      slug: 'bebop',
      genreIds: [uuid(1).toUpperCase()],
    })
    expect(parsed.genreIds).toEqual([uuid(1)])
  })

  it('requires a slug', () => {
    expect(createAnimeInputSchema.safeParse({}).success).toBe(false)
  })
})

describe('listAnimeInputSchema', () => {
  it('coerces query values and applies list defaults', () => {
    expect(
      listAnimeInputSchema.parse({
        startYearMin: '1998',
        startYearMax: '2005',
        includeDeleted: 'true',
      }),
    ).toMatchObject({
      startYearMin: 1998,
      startYearMax: 2005,
      includeDeleted: true,
      sort: '-createdAt',
      limit: 20,
      offset: 0,
    })
  })

  it('rejects unknown sort keys and over-long queries', () => {
    expect(listAnimeInputSchema.safeParse({ sort: 'id' }).success).toBe(false)
    expect(listAnimeInputSchema.safeParse({ sort: 'recent' }).success).toBe(
      false,
    )
    expect(listAnimeInputSchema.safeParse({ q: 'x'.repeat(121) }).success).toBe(
      false,
    )
  })

  it('accepts every signed sort key', () => {
    for (const sort of ANIME_SORT_KEYS) {
      expect(listAnimeInputSchema.parse({ sort }).sort).toBe(sort)
    }
  })
})

describe('parseAnimeSort', () => {
  it('splits a signed key into a field and a direction', () => {
    expect(parseAnimeSort('-createdAt')).toEqual({
      field: 'createdAt',
      order: 'desc',
    })
    expect(parseAnimeSort('title')).toEqual({ field: 'title', order: 'asc' })
    expect(parseAnimeSort('-startDate')).toEqual({
      field: 'startDate',
      order: 'desc',
    })
  })

  it('yields a field the sort schema knows for every key', () => {
    for (const sort of ANIME_SORT_KEYS) {
      const { field, order } = parseAnimeSort(sort)
      expect(animeSortFieldSchema.safeParse(field).success).toBe(true)
      expect(sortOrderSchema.safeParse(order).success).toBe(true)
    }
  })
})
