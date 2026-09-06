import { describe, expect, it } from 'vitest'
import { preferredLocalized } from './preferred'

const translations = [
  { locale: 'ja-Jpan', title: '進撃の巨人', original: true },
  { locale: 'ja-Latn', title: 'Shingeki no Kyojin', original: false },
  { locale: 'en', title: 'Attack on Titan', original: false },
  { locale: 'de', title: 'Attack on Titan', original: false },
]

describe('preferredLocalized', () => {
  it('falls back to english when the client states no preference', () => {
    expect(preferredLocalized(translations)?.locale).toBe('en')
  })

  it('prefers an exact locale match over english', () => {
    expect(preferredLocalized(translations, 'de')?.locale).toBe('de')
  })

  it('matches on language when no exact tag is available', () => {
    expect(preferredLocalized(translations, 'ja')?.locale).toBe('ja-Jpan')
  })

  it('honours quality weights in order', () => {
    expect(
      preferredLocalized(translations, 'de;q=0.4,ja-Latn;q=0.9')?.locale,
    ).toBe('ja-Latn')
  })

  it('falls back to the original when english is missing', () => {
    const withoutEnglish = translations.filter(
      (translation) => translation.locale !== 'en',
    )
    expect(preferredLocalized(withoutEnglish, 'fr')?.locale).toBe('ja-Jpan')
  })

  it('returns null for an empty list', () => {
    expect(preferredLocalized([])).toBeNull()
  })
})
