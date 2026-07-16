import type { AppAuthClient } from '@hayasedb/auth'

let inFlight: Promise<boolean> | null = null

async function invalidate(auth: AppAuthClient): Promise<boolean> {
  const { data } = await auth.getSession({
    query: { disableCookieCache: true },
  })
  if (data?.user) return false

  await auth.signOut().catch(() => {})
  await refreshNuxtData('app-session')

  useToast().add({
    title: 'Session expired',
    description: 'Please sign in again to continue.',
    color: 'warning',
  })

  await navigateTo('/login')
  return true
}

export function handleUnauthenticated(auth: AppAuthClient): Promise<boolean> {
  if (import.meta.server) return Promise.resolve(false)

  inFlight ??= invalidate(auth).finally(() => {
    inFlight = null
  })

  return inFlight
}
