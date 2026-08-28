import { describe, expect, it } from 'vitest'
import {
  localeSchema,
  localizedEpisodeTextListSchema,
  localizedTitleListSchema,
} from './localization'

describe('localeSchema', () => {
  it('canonicalizes BCP 47 tags regardless of casing', () => {
    expect(localeSchema.parse('pt-br')).toBe('pt-BR')
    expect(localeSchema.parse('ZH-hans')).toBe('zh-Hans')
  })

  it('rejects an unsupported tag', () => {
    expect(localeSchema.safeParse('xx').success).toBe(false)
  })
})

describe('localized list schemas', () => {
  it('NFC-normalizes titles and sorts entries by locale', () => {
    expect(
      localizedTitleListSchema.parse([
        { locale: 'ja-jpan', title: 'ホシ', original: true },
        { locale: 'en', title: 'Café' },
      ]),
    ).toEqual([
      { locale: 'en', title: 'Café', original: false },
      { locale: 'ja-Jpan', title: 'ホシ', original: true },
    ])
  })

  it('rejects duplicate locales once canonicalized', () => {
    expect(
      localizedTitleListSchema.safeParse([
        { locale: 'pt-br', title: 'A' },
        { locale: 'pt-BR', title: 'B' },
      ]).success,
    ).toBe(false)
  })

  it('allows at most one original title', () => {
    expect(
      localizedTitleListSchema.safeParse([
        { locale: 'en', title: 'A', original: true },
        { locale: 'de', title: 'B', original: true },
      ]).success,
    ).toBe(false)
  })

  it('applies the same rules to episode text lists', () => {
    expect(
      localizedEpisodeTextListSchema.safeParse([
        { locale: 'en', title: 'A', original: true },
        { locale: 'en', title: 'B' },
      ]).success,
    ).toBe(false)
  })

  it('defaults a missing overview to null', () => {
    expect(
      localizedEpisodeTextListSchema.parse([{ locale: 'en', title: 'A' }]),
    ).toEqual([{ locale: 'en', title: 'A', original: false, overview: null }])
  })
})
