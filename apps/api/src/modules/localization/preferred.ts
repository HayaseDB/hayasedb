import { localeRanking, rankOf } from './locale-ranking'

export function preferredLocalized<
  T extends { locale: string; original?: boolean },
>(translations: T[], acceptLanguage?: string): T | null {
  if (translations.length === 0) return null

  const ranking = localeRanking(acceptLanguage)
  return translations.reduce((best, candidate) => {
    const bestRank = rankOf(ranking, best)
    const candidateRank = rankOf(ranking, candidate)
    if (candidateRank !== bestRank)
      return candidateRank < bestRank ? candidate : best
    return candidate.locale.localeCompare(best.locale) < 0 ? candidate : best
  })
}

export function requirePreferredLocalized<
  T extends { locale: string; original?: boolean },
>(translations: T[], acceptLanguage: string | undefined, fallback: T): T {
  return preferredLocalized(translations, acceptLanguage) ?? fallback
}
