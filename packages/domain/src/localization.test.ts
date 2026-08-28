import { describe, expect, it } from 'vitest'
import {
  canonicalizeLocale,
  LOCALIZATION_LOCALE_LABELS,
  LOCALIZATION_LOCALE_OPTIONS,
  LOCALIZATION_LOCALES,
} from './localization'

describe('canonicalizeLocale', () => {
  it('returns a supported tag unchanged', () => {
    expect(canonicalizeLocale('en')).toBe('en')
    expect(canonicalizeLocale('pt-BR')).toBe('pt-BR')
  })

  it('treats tags case-insensitively, as BCP 47 requires', () => {
    expect(canonicalizeLocale('pt-br')).toBe('pt-BR')
    expect(canonicalizeLocale('PT-BR')).toBe('pt-BR')
    expect(canonicalizeLocale('zh-hans')).toBe('zh-Hans')
    expect(canonicalizeLocale('JA-jpan')).toBe('ja-Jpan')
  })

  it('ignores surrounding whitespace', () => {
    expect(canonicalizeLocale('  en  ')).toBe('en')
  })

  it('returns undefined for an unsupported tag', () => {
    expect(canonicalizeLocale('xx')).toBeUndefined()
    expect(canonicalizeLocale('')).toBeUndefined()
  })

  it('does not widen a region-specific tag to its base language', () => {
    expect(canonicalizeLocale('pt')).toBeUndefined()
    expect(canonicalizeLocale('zh')).toBeUndefined()
  })
})

describe('locale metadata', () => {
  it('labels every supported locale', () => {
    for (const locale of LOCALIZATION_LOCALES) {
      expect(LOCALIZATION_LOCALE_LABELS[locale]).toBeTruthy()
    }
  })

  it('offers one option per locale, in declaration order', () => {
    expect(LOCALIZATION_LOCALE_OPTIONS.map((option) => option.value)).toEqual([
      ...LOCALIZATION_LOCALES,
    ])
  })

  it('has no duplicate tags', () => {
    expect(new Set(LOCALIZATION_LOCALES).size).toBe(LOCALIZATION_LOCALES.length)
  })
})
