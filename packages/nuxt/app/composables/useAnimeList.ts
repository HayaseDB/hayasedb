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
  genre: Ref<string | undefined>
  yearMin?: Ref<number | undefined>
  yearMax?: Ref<number | undefined>
  sort: Ref<ListAnimeInput['sort']>
  page: Ref<number>
}

export async function useAnimeListData(
  key: string,
  pageSize: number,
  inputs: AnimeListInputs,
) {
  const api = useApiClient()
  const { genres } = useGenres()

  const listData = useAsyncData(
    key,
    () =>
      api.anime.list({
        q: inputs.debouncedQ.value || undefined,
        format: inputs.format.value,
        status: inputs.status.value,
        genre: inputs.genre.value,
        startYearMin: inputs.yearMin?.value,
        startYearMax: inputs.yearMax?.value,
        sort: inputs.sort.value,
        limit: pageSize,
        offset: (inputs.page.value - 1) * pageSize,
      }),
    {
      watch: [
        inputs.debouncedQ,
        inputs.format,
        inputs.status,
        inputs.genre,
        ...(inputs.yearMin ? [inputs.yearMin] : []),
        ...(inputs.yearMax ? [inputs.yearMax] : []),
        inputs.sort,
        inputs.page,
      ],
    },
  )

  const { data } = await listData
  const { status: reqStatus, refresh } = listData

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
    genre?: string
  }
}

export async function useAnimeList(options: UseAnimeListOptions) {
  const pageSize = options.pageSize ?? 24

  const q = ref(options.initial?.q ?? '')
  const debouncedQ = refDebounced(q, 300)
  const format = ref<AnimeFormat | undefined>(options.initial?.format)
  const status = ref<AnimeStatus | undefined>(options.initial?.status)
  const genre = ref<string | undefined>(options.initial?.genre)
  const sort = ref<ListAnimeInput['sort']>('-createdAt')
  const page = ref(1)

  watch([debouncedQ, format, status, genre, sort], () => {
    page.value = 1
  })

  const data = await useAnimeListData(options.key, pageSize, {
    debouncedQ,
    format,
    status,
    genre,
    sort,
    page,
  })

  const hasFilters = computed(
    () => !!(q.value || format.value || status.value || genre.value),
  )

  function resetFilters() {
    q.value = ''
    format.value = undefined
    status.value = undefined
    genre.value = undefined
  }

  return {
    q,
    debouncedQ,
    format,
    status,
    genre,
    sort,
    page,
    pageSize,
    hasFilters,
    resetFilters,
    ...data,
  }
}
