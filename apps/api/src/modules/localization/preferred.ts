import { rankOf } from './locale-ranking'

export function preferredLocalized<
  T extends { locale: string; original?: boolean },
>(translations: T[]): T | null {
  if (translations.length === 0) return null

  return translations.reduce((best, candidate) => {
    const bestRank = rankOf(best)
    const candidateRank = rankOf(candidate)
    if (candidateRank !== bestRank)
      return candidateRank < bestRank ? candidate : best
    return candidate.locale.localeCompare(best.locale) < 0 ? candidate : best
  })
}

export function requirePreferredLocalized<
  T extends { locale: string; original?: boolean },
>(translations: T[], fallback: T): T {
  return preferredLocalized(translations) ?? fallback
}
