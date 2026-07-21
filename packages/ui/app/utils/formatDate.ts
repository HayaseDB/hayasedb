const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const NO_DATE = '—'

export function formatDateTime(value?: Date | string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : NO_DATE
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', {
  numeric: 'auto',
})

const RELATIVE_UNITS = [
  { unit: 'year', ms: 31_536_000_000 },
  { unit: 'month', ms: 2_592_000_000 },
  { unit: 'week', ms: 604_800_000 },
  { unit: 'day', ms: 86_400_000 },
  { unit: 'hour', ms: 3_600_000 },
  { unit: 'minute', ms: 60_000 },
] as const

export function formatRelativeTime(value?: Date | string | null): string {
  if (!value) return NO_DATE

  const diff = new Date(value).getTime() - Date.now()
  const abs = Math.abs(diff)

  for (const { unit, ms } of RELATIVE_UNITS) {
    if (abs >= ms) {
      return relativeTimeFormatter.format(Math.round(diff / ms), unit)
    }
  }
  return 'just now'
}
