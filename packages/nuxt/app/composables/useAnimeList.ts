import { refDebounced } from '@vueuse/core'
import type {
  AnimeFormat,
  AnimeStatus,
  ListAnimeInput,
} from '@hayasedb/contract'

export interface UseAnimeListOptions {
  key: string
  pageSize?: number
  initial?: {
    q?: string
    format?: AnimeFormat
    status?: AnimeStatus
    genreId?: string
  }
}

export function useAnimeList(options: UseAnimeListOptions) {
  const api = useApiClient()
  const pageSize = options.pageSize ?? 24

  const q = ref(options.initial?.q ?? '')
  const debouncedQ = refDebounced(q, 300)
  const format = ref<AnimeFormat | undefined>(options.initial?.format)
  const status = ref<AnimeStatus | undefined>(options.initial?.status)
  const genreId = ref<string | undefined>(options.initial?.genreId)
  const sort = ref<ListAnimeInput['sort']>('recent')
  const order = ref<ListAnimeInput['order']>('desc')
  const page = ref(1)

  const filters = [debouncedQ, format, status, genreId, sort, order] as const
  watch(filters, () => {
    page.value = 1
  })

  const { genres } = useGenres()

  const {
    data,
    status: reqStatus,
    refresh,
  } = useAsyncData(
    options.key,
    () =>
      api.anime.list({
        q: debouncedQ.value || undefined,
        format: format.value,
        status: status.value,
        genreId: genreId.value,
        sort: sort.value,
        order: order.value,
        limit: pageSize,
        offset: (page.value - 1) * pageSize,
      }),
    { watch: [...filters, page] },
  )

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.meta.total ?? 0)
  const pending = computed(() => reqStatus.value === 'pending')

  return {
    q,
    debouncedQ,
    format,
    status,
    genreId,
    sort,
    order,
    page,
    pageSize,
    genres,
    items,
    total,
    pending,
    refresh,
  }
}
