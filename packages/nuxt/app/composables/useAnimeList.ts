import { refDebounced } from '@vueuse/core'
import type {
  AnimeFormat,
  AnimeStatus,
  ListAnimeInput,
} from '@hayasedb/contract'

export interface AnimeListInputs {
  debouncedQ: Ref<string>
  format: Ref<AnimeFormat | undefined>
  status: Ref<AnimeStatus | undefined>
  genreId: Ref<string | undefined>
  sort: Ref<ListAnimeInput['sort']>
  order: Ref<ListAnimeInput['order']>
  page: Ref<number>
}

export function useAnimeListData(
  key: string,
  pageSize: number,
  inputs: AnimeListInputs,
) {
  const api = useApiClient()
  const { genres } = useGenres()

  const {
    data,
    status: reqStatus,
    refresh,
  } = useAsyncData(
    key,
    () =>
      api.anime.list({
        q: inputs.debouncedQ.value || undefined,
        format: inputs.format.value,
        status: inputs.status.value,
        genreId: inputs.genreId.value,
        sort: inputs.sort.value,
        order: inputs.order.value,
        limit: pageSize,
        offset: (inputs.page.value - 1) * pageSize,
      }),
    {
      watch: [
        inputs.debouncedQ,
        inputs.format,
        inputs.status,
        inputs.genreId,
        inputs.sort,
        inputs.order,
        inputs.page,
      ],
    },
  )

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.meta.total ?? 0)
  const pending = computed(() => reqStatus.value === 'pending')

  return { genres, items, total, pending, refresh }
}

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
  const pageSize = options.pageSize ?? 24

  const q = ref(options.initial?.q ?? '')
  const debouncedQ = refDebounced(q, 300)
  const format = ref<AnimeFormat | undefined>(options.initial?.format)
  const status = ref<AnimeStatus | undefined>(options.initial?.status)
  const genreId = ref<string | undefined>(options.initial?.genreId)
  const sort = ref<ListAnimeInput['sort']>('recent')
  const order = ref<ListAnimeInput['order']>('desc')
  const page = ref(1)

  watch([debouncedQ, format, status, genreId, sort, order], () => {
    page.value = 1
  })

  const data = useAnimeListData(options.key, pageSize, {
    debouncedQ,
    format,
    status,
    genreId,
    sort,
    order,
    page,
  })

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
    ...data,
  }
}
