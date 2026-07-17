import { useEventListener } from '@vueuse/core'
import {
  onSessionChanged,
  refreshAppSession,
} from '../composables/useSessionSync'

export default defineNuxtPlugin(() => {
  const { data: session } = useNuxtData('app-session')

  const refresh = () => refreshAppSession({ broadcast: false })

  onSessionChanged(() => void refresh())

  const refreshIfAuthenticated = () => {
    if (document.visibilityState === 'visible' && session.value) void refresh()
  }

  useEventListener(document, 'visibilitychange', refreshIfAuthenticated)
  useEventListener(window, 'focus', refreshIfAuthenticated)
})
