const NOTICE_WINDOW_MS = 10_000

let lastNoticeAt = 0

export function notifyRateLimited(): void {
  if (import.meta.server) return

  const now = Date.now()
  if (now - lastNoticeAt < NOTICE_WINDOW_MS) return
  lastNoticeAt = now

  useToast().add({
    title: 'Too many requests',
    description:
      'You are going a bit fast. Please wait a moment, or use an API key for programmatic access.',
    color: 'warning',
  })
}
