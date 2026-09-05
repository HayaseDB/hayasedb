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

export function formatEpisodeDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}
