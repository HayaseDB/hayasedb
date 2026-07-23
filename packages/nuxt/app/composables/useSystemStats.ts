import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'

export const SYSTEM_STATS_KEY = 'system-stats'

const POLL_INTERVAL_MS = 30_000

export function useSystemStats() {
  const api = useApiClient()
  const result = useAsyncData(SYSTEM_STATS_KEY, () => api.system.stats())

  if (import.meta.client) {
    const visibility = useDocumentVisibility()
    const { pause, resume } = useIntervalFn(
      () => void result.refresh(),
      POLL_INTERVAL_MS,
    )
    watch(visibility, (state) => {
      if (state === 'visible') {
        void result.refresh()
        resume()
      } else {
        pause()
      }
    })
  }

  return result
}
