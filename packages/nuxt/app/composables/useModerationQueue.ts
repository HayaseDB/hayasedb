import type { ChangesetStatus } from '@hayasedb/contract'

export function useModerationQueue(options: { pageSize?: number } = {}) {
  const api = useApiClient()
  return usePaginatedList<
    Awaited<
      ReturnType<ReturnType<typeof useApiClient>['changeset']['list']>
    >['items'][number],
    ChangesetStatus
  >({
    key: 'moderation-queue',
    initialStatus: 'pending',
    pageSize: options.pageSize,
    fetch: (args) => api.changeset.list(args),
  })
}

export function useModerationActions() {
  const api = useApiClient()
  const toast = useToast()

  const busy = ref(false)

  async function run<T>(
    action: () => Promise<T>,
    failureTitle: string,
  ): Promise<T | false> {
    busy.value = true
    try {
      const result = await action()
      await refreshModerationCounts()
      return result
    } catch (error) {
      toast.add({
        title: orpcErrorMessage(error) ?? failureTitle,
        color: 'error',
      })
      return false
    } finally {
      busy.value = false
    }
  }

  async function approve(id: string) {
    const detail = await run(
      () => api.changeset.approve({ id }),
      'Failed to approve changeset',
    )
    if (detail) {
      toast.add(
        detail.status === 'approved'
          ? { title: 'Changeset applied', color: 'success' }
          : {
              title: 'Conflicts detected',
              description: 'See the notes for what blocked the approval.',
              color: 'warning',
            },
      )
    }
    return detail
  }

  async function reject(id: string, note: string) {
    const detail = await run(
      () => api.changeset.reject({ id, note }),
      'Failed to reject changeset',
    )
    if (detail) toast.add({ title: 'Changeset rejected', color: 'success' })
    return detail
  }

  async function revertChangeset(id: string) {
    const detail = await run(
      () => api.changeset.revert({ id }),
      'Failed to revert changeset',
    )
    if (detail) toast.add({ title: 'Revert applied', color: 'success' })
    return detail
  }

  async function revertToRevision(id: string) {
    const detail = await run(
      () => api.revision.revert({ id }),
      'Failed to revert',
    )
    if (detail) {
      toast.add({
        title:
          detail.status === 'approved'
            ? 'Revert applied'
            : 'Revert blocked by conflicts',
        color: detail.status === 'approved' ? 'success' : 'warning',
      })
    }
    return detail
  }

  return {
    busy,
    approve,
    reject,
    revertChangeset,
    revertToRevision,
  }
}

export const MODERATION_COUNTS_KEY = 'moderation-counts'

export function refreshModerationCounts() {
  return refreshNuxtData(MODERATION_COUNTS_KEY)
}

export function useModerationCounts() {
  const api = useApiClient()
  const { data, refresh } = useAsyncData(MODERATION_COUNTS_KEY, () =>
    api.changeset.stats(),
  )
  const pendingCount = computed(() => data.value?.pending ?? 0)
  return { pendingCount, refresh }
}
