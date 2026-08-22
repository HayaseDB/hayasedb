import { useEventListener } from '@vueuse/core'
import {
  onSessionChanged,
  refreshAppSession,
} from '../composables/useSessionSync'

export default defineNuxtPlugin(() => {
  const { data: session } = useNuxtData('app-session')
  const router = useRouter()

  const refresh = () => refreshAppSession({ broadcast: false })

  onSessionChanged(() => void refresh())

  const refreshIfAuthenticated = () => {
    if (document.visibilityState === 'visible' && session.value) void refresh()
  }

  useEventListener(document, 'visibilitychange', refreshIfAuthenticated)
  useEventListener(window, 'focus', refreshIfAuthenticated)

  watch(
    () => session.value?.session.id,
    (sessionId, previousSessionId) => {
      if (previousSessionId !== undefined && sessionId !== previousSessionId) {
        const { path, query, hash } = router.currentRoute.value
        void router.replace({ path, query, hash, force: true })
      }
    },
  )
})
