interface PaginatedResult<TItem> {
  items: TItem[]
  meta: { total: number }
}

interface PaginatedListOptions<TItem, TStatus> {
  key: string
  fetch: (args: {
    status: TStatus
    limit: number
    offset: number
  }) => Promise<PaginatedResult<TItem>>
  initialStatus: TStatus
  pageSize?: number
}

export function usePaginatedList<TItem, TStatus>(
  options: PaginatedListOptions<TItem, TStatus>,
) {
  const pageSize = options.pageSize ?? 20

  const status = ref(options.initialStatus) as Ref<TStatus>
  const page = ref(1)

  watch(status, () => {
    page.value = 1
  })

  const {
    data,
    status: reqStatus,
    refresh,
  } = useAsyncData(
    () => `${options.key}-${String(status.value)}-${page.value}`,
    () =>
      options.fetch({
        status: status.value,
        limit: pageSize,
        offset: (page.value - 1) * pageSize,
      }),
    { watch: [status, page] },
  )

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.meta.total ?? 0)
  const pending = computed(() => reqStatus.value === 'pending')

  return { status, page, pageSize, items, total, pending, refresh }
}
