const ENGLISH_RANK = 0
const ORIGINAL_RANK = 1
const FALLBACK_RANK = 2

export function rankOf(candidate: {
  locale: string
  original?: boolean
}): number {
  if (candidate.locale === 'en') return ENGLISH_RANK
  if (candidate.original) return ORIGINAL_RANK
  return FALLBACK_RANK
}

export const LOCALE_RANK_BASES = {
  english: ENGLISH_RANK,
  original: ORIGINAL_RANK,
  fallback: FALLBACK_RANK,
} as const
