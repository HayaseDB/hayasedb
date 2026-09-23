import { describe, expect, it } from 'vitest'
import { formatEpisodeNumber } from './episode'

describe('formatEpisodeNumber', () => {
  it('drops the trailing zeros a numeric column serializes', () => {
    expect(formatEpisodeNumber('3.000')).toBe('3')
    expect(formatEpisodeNumber('1.500')).toBe('1.5')
    expect(formatEpisodeNumber(2)).toBe('2')
  })

  it('keeps a non numeric label and reports a missing one', () => {
    expect(formatEpisodeNumber('OVA')).toBe('OVA')
    expect(formatEpisodeNumber('')).toBeNull()
    expect(formatEpisodeNumber(null)).toBeNull()
  })
})
