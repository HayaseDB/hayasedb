import { formatFuzzyDate, type FuzzyDate } from '@hayasedb/domain'

export function formatAnimeDate(value?: FuzzyDate | null): string | null {
  return value ? formatFuzzyDate(value) : null
}

export function formatAnimeDateRange(
  start?: FuzzyDate | null,
  end?: FuzzyDate | null,
): string | null {
  const from = formatAnimeDate(start)
  const to = formatAnimeDate(end)
  if (from && to) return from === to ? from : `${from} – ${to}`
  return from ?? to
}
