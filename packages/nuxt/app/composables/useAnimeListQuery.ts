import { refDebounced } from '@vueuse/core'
import {
  ANIME_FORMATS,
  ANIME_SORT_KEYS,
  ANIME_STATUSES,
  type AnimeFormat,
  type AnimeSortKey,
  type AnimeStatus,
} from '@hayasedb/domain'
import type { ListAnimeInput } from '@hayasedb/contract'

export interface UseAnimeListQueryOptions {
  key: string
  pageSize?: number
  path?: string
}

function firstParam(value: unknown): string | undefined {
  const single = Array.isArray(value) ? value[0] : value
  return typeof single === 'string' && single.length > 0 ? single : undefined
}

function enumParam<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  const single = firstParam(value)
  return single !== undefined && (allowed as readonly string[]).includes(single)
    ? (single as T)
    : undefined
}

function positiveInt(value: unknown): number | undefined {
  const single = firstParam(value)
  if (single === undefined) return undefined
  const parsed = Number.parseInt(single, 10)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined
}

function yearParam(value: unknown): number | undefined {
  return positiveInt(value)
}

const DEFAULT_SORT_KEY: AnimeSortKey = '-createdAt'

interface QueryPatch {
  q?: string
  format?: AnimeFormat
  status?: AnimeStatus
  genre?: string
  yearMin?: number
  yearMax?: number
  sort?: AnimeSortKey
}

export async function useAnimeListQuery(options: UseAnimeListQueryOptions) {
  const route = useRoute()
  const router = useRouter()
  const pageSize = options.pageSize ?? 24
  const path = options.path ?? '/explore'

  function buildQuery(patch: QueryPatch): Record<string, string> {
    const next = {
      q: firstParam(route.query.q),
      format: enumParam(route.query.format, ANIME_FORMATS),
      status: enumParam(route.query.status, ANIME_STATUSES),
      genre: firstParam(route.query.genre),
      yearMin: yearParam(route.query.yearMin),
      yearMax: yearParam(route.query.yearMax),
      sort: enumParam(route.query.sort, ANIME_SORT_KEYS),
      ...patch,
    }
    const query: Record<string, string> = {}
    if (next.q) query.q = next.q
    if (next.format) query.format = next.format
    if (next.status) query.status = next.status
    if (next.genre) query.genre = next.genre
    if (next.yearMin) query.yearMin = String(next.yearMin)
    if (next.yearMax) query.yearMax = String(next.yearMax)
    if (next.sort && next.sort !== DEFAULT_SORT_KEY) query.sort = next.sort
    return query
  }

  function navigate(patch: QueryPatch, opts: { replace?: boolean } = {}) {
    const target = { query: buildQuery(patch) }
    return opts.replace ? router.replace(target) : router.push(target)
  }

  const format = computed({
    get: () => enumParam(route.query.format, ANIME_FORMATS),
    set: (value: AnimeFormat | undefined) => {
      void navigate({ format: value })
    },
  })
  const status = computed({
    get: () => enumParam(route.query.status, ANIME_STATUSES),
    set: (value: AnimeStatus | undefined) => {
      void navigate({ status: value })
    },
  })
  const genre = computed({
    get: () => firstParam(route.query.genre),
    set: (value: string | undefined) => {
      void navigate({ genre: value })
    },
  })
  const yearMin = computed({
    get: () => yearParam(route.query.yearMin),
    set: (value: number | undefined) => {
      void navigate({ yearMin: value })
    },
  })
  const yearMax = computed({
    get: () => yearParam(route.query.yearMax),
    set: (value: number | undefined) => {
      void navigate({ yearMax: value })
    },
  })
  const sortKey = computed({
    get: (): AnimeSortKey =>
      enumParam(route.query.sort, ANIME_SORT_KEYS) ?? DEFAULT_SORT_KEY,
    set: (value: AnimeSortKey | undefined) => {
      void navigate({ sort: value ?? DEFAULT_SORT_KEY })
    },
  })
  const page = computed(() => positiveInt(route.query.page) ?? 1)

  const urlQ = computed(() => firstParam(route.query.q) ?? '')
  const q = ref(urlQ.value)
  const debouncedQ = refDebounced(q, 300)
  watch(debouncedQ, (value) => {
    if (urlQ.value !== value) {
      void navigate({ q: value || undefined }, { replace: true })
    }
  })
  watch(urlQ, (value) => {
    if (value !== q.value) q.value = value
  })

  const sort = computed<ListAnimeInput['sort']>(() => sortKey.value)

  const data = await useAnimeListData(options.key, pageSize, {
    debouncedQ: urlQ,
    format,
    status,
    genre,
    yearMin,
    yearMax,
    sort,
    page,
  })

  const hasFilters = computed(
    () =>
      !!(
        urlQ.value ||
        format.value ||
        status.value ||
        genre.value ||
        yearMin.value ||
        yearMax.value
      ),
  )

  function resetFilters() {
    q.value = ''
    void router.push({ path })
  }

  function pageTo(target: number) {
    const query = buildQuery({})
    if (target > 1) query.page = String(target)
    return { query }
  }

  return {
    q,
    format,
    status,
    genre,
    yearMin,
    yearMax,
    sortKey,
    page,
    pageSize,
    pageTo,
    hasFilters,
    resetFilters,
    ...data,
  }
}
