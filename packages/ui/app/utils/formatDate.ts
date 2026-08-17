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
