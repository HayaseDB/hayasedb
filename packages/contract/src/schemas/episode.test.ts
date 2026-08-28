import { describe, expect, it } from 'vitest'
import { animeEpisodeDocumentSchema, episodeNumberSchema } from './episode'

describe('episode schemas', () => {
  it('keeps exact decimal episode numbers as strings', () => {
    expect(episodeNumberSchema.parse('12.500')).toBe('12.500')
    expect(episodeNumberSchema.safeParse('12.5001').success).toBe(false)
    expect(episodeNumberSchema.safeParse(-1).success).toBe(false)
  })

  it('requires exactly one episode owner', () => {
    const fields = {
      number: '1',
      position: 0,
      type: 'REGULAR' as const,
      status: 'UPCOMING' as const,
      airDate: null,
      durationSeconds: null,
      stillMediaId: null,
      translations: [],
    }
    expect(
      animeEpisodeDocumentSchema.safeParse({
        ...fields,
        animeId: '00000000-0000-7000-8000-000000000001',
        seasonId: null,
      }).success,
    ).toBe(true)
    expect(
      animeEpisodeDocumentSchema.safeParse({
        ...fields,
        animeId: null,
        seasonId: null,
      }).success,
    ).toBe(false)
  })
})
