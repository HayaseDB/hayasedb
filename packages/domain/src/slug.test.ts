import { describe, expect, it } from 'vitest'
import { genreSlug } from './slug'

describe('genreSlug', () => {
  it('lowercases and hyphenates a plain name', () => {
    expect(genreSlug('Slice of Life')).toBe('slice-of-life')
  })

  it('folds accents to their base letter so the slug stays alphanumeric', () => {
    expect(genreSlug('Café')).toBe('cafe')
    expect(genreSlug('Shōnen')).toBe('shonen')
  })

  it('collapses runs of punctuation into a single hyphen', () => {
    expect(genreSlug('Sci-Fi  &  Fantasy')).toBe('sci-fi-fantasy')
  })

  it('trims leading and trailing separators', () => {
    expect(genreSlug('  -Action-  ')).toBe('action')
  })

  it('falls back to a placeholder when nothing maps to a slug', () => {
    expect(genreSlug('日本語')).toBe('genre')
    expect(genreSlug('!!!')).toBe('genre')
  })

  it('produces a slug the contract accepts', () => {
    const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    for (const name of ['Café', 'Shōnen', 'Sci-Fi & Fantasy', '!!!', 'Mecha']) {
      expect(genreSlug(name)).toMatch(pattern)
    }
  })
})
