export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput

  const nowMs = Date.now()
  const thenMs = date.getTime()
  const diffSec = Math.floor((nowMs - thenMs) / 1000)

  if (diffSec < 0) return 'Just now'
  if (diffSec < 60) return 'Just now'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`

  if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
