const animeDateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export function formatAnimeDate(value?: string | null): string | null {
  return value ? animeDateFormatter.format(new Date(value)) : null
}

export function formatAnimeDateRange(
  start?: string | null,
  end?: string | null,
): string | null {
  const from = formatAnimeDate(start)
  const to = formatAnimeDate(end)
  if (from && to) return from === to ? from : `${from} – ${to}`
  return from ?? to
}
