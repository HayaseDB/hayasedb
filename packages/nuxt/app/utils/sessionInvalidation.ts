import { refreshAppSession } from '../composables/useSessionSync'

let inFlight: Promise<void> | null = null

async function invalidate(): Promise<void> {
  const { data: session } = useNuxtData('app-session')
  if (!session.value) return

  await refreshAppSession()
  if (session.value) return

  useToast().add({
    title: 'Session expired',
    description: 'Please sign in again to continue.',
    color: 'warning',
  })
}

export function handleUnauthenticated(): Promise<void> {
  if (import.meta.server) return Promise.resolve()

  inFlight ??= invalidate().finally(() => {
    inFlight = null
  })

  return inFlight
}
