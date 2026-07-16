import type { ChangesetStatus } from '@hayasedb/contract'

export function useMyContributions(options: { pageSize?: number } = {}) {
  const api = useApiClient()
  return usePaginatedList<
    Awaited<
      ReturnType<ReturnType<typeof useApiClient>['changeset']['list']>
    >['items'][number],
    ChangesetStatus | undefined
  >({
    key: 'my-contributions',
    initialStatus: undefined,
    pageSize: options.pageSize,
    fetch: (args) => api.changeset.list({ ...args, mine: true }),
  })
}
