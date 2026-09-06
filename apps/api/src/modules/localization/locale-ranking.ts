const EXACT_RANK_BASE = 0
const LANGUAGE_RANK_BASE = 100
const ENGLISH_RANK = 200
const ORIGINAL_RANK = 201
const FALLBACK_RANK = 202

export interface LocaleRanking {
  exact: string[]
  languages: string[]
}

function languageOf(locale: string): string {
  return locale.split('-')[0]!.toLowerCase()
}

export function acceptedLocales(header?: string): string[] {
  const weighted = (header ?? '')
    .split(',')
    .map((part, index) => {
      const [rawLocale, ...parameters] = part.trim().split(';')
      const qParameter = parameters.find((parameter) =>
        parameter.trim().startsWith('q='),
      )
      const quality = qParameter ? Number(qParameter.trim().slice(2)) : 1
      if (
        !rawLocale ||
        rawLocale === '*' ||
        !Number.isFinite(quality) ||
        quality <= 0
      ) {
        return null
      }
      try {
        return {
          locale: Intl.getCanonicalLocales(rawLocale)[0]!,
          quality: Math.min(quality, 1),
          index,
        }
      } catch {
        return null
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)

  return [...new Set(weighted.map((item) => item.locale))]
}

export function localeRanking(acceptLanguage?: string): LocaleRanking {
  const exact = acceptedLocales(acceptLanguage)
  return {
    exact,
    languages: [...new Set(exact.map(languageOf))],
  }
}

export function rankOf(
  ranking: LocaleRanking,
  candidate: { locale: string; original?: boolean },
): number {
  const exactIndex = ranking.exact.indexOf(candidate.locale)
  if (exactIndex >= 0) return EXACT_RANK_BASE + exactIndex

  const languageIndex = ranking.languages.indexOf(languageOf(candidate.locale))
  if (languageIndex >= 0) return LANGUAGE_RANK_BASE + languageIndex

  if (candidate.locale === 'en') return ENGLISH_RANK
  if (candidate.original) return ORIGINAL_RANK
  return FALLBACK_RANK
}

export const LOCALE_RANK_BASES = {
  exact: EXACT_RANK_BASE,
  language: LANGUAGE_RANK_BASE,
  original: ORIGINAL_RANK,
  english: ENGLISH_RANK,
  fallback: FALLBACK_RANK,
} as const
