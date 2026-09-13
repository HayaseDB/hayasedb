import { describe, expect, it } from 'vitest'
import { preferredLocalized, requirePreferredLocalized } from './preferred'

const en = { locale: 'en', title: 'Attack on Titan' }
const ja = { locale: 'ja-Jpan', title: '進撃の巨人', original: true }
const de = { locale: 'de', title: 'Attack on Titan' }

describe('preferredLocalized', () => {
  it('returns null when there is nothing to choose from', () => {
    expect(preferredLocalized([])).toBeNull()
  })

  it('prefers english over the original locale', () => {
    expect(preferredLocalized([ja, en])).toBe(en)
  })

  it('prefers english regardless of input order', () => {
    expect(preferredLocalized([en, ja])).toBe(en)
  })

  it('falls back to the original locale without english', () => {
    expect(preferredLocalized([de, ja])).toBe(ja)
  })

  it('falls back to any locale without english or an original', () => {
    expect(preferredLocalized([de])).toBe(de)
  })

  it('breaks ties between fallbacks deterministically', () => {
    const fr = { locale: 'fr', title: "L'Attaque des Titans" }
    expect(preferredLocalized([fr, de])).toBe(de)
    expect(preferredLocalized([de, fr])).toBe(de)
  })
})

describe('requirePreferredLocalized', () => {
  it('returns the preferred translation when one exists', () => {
    expect(requirePreferredLocalized([ja, en], de)).toBe(en)
  })

  it('returns the fallback when there is no translation', () => {
    expect(requirePreferredLocalized([], de)).toBe(de)
  })
})
