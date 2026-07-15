import { refDebounced } from '@vueuse/core'

export type AdminUserFilter = 'admins' | 'banned'
export type AdminUserSortBy = 'name' | 'createdAt'

export interface UseAdminUsersOptions {
  key: string
  pageSize?: number
}

export function useAdminUsers(options: UseAdminUsersOptions) {
  const auth = useAuth()
  const pageSize = options.pageSize ?? 20

  const q = ref('')
  const debouncedQ = refDebounced(q, 300)
  const filter = ref<AdminUserFilter | undefined>(undefined)
  const sortBy = ref<AdminUserSortBy>('createdAt')
  const sortDirection = ref<'asc' | 'desc'>('desc')
  const page = ref(1)

  const filters = [debouncedQ, filter, sortBy, sortDirection] as const
  watch(filters, () => {
    page.value = 1
  })

  const {
    data,
    status: reqStatus,
    refresh,
  } = useAsyncData(
    options.key,
    async () => {
      const search = debouncedQ.value.trim()
      const { data: result, error } = await auth.admin.listUsers({
        query: {
          ...(search
            ? {
                searchValue: search,
                searchField: search.includes('@') ? 'email' : 'name',
                searchOperator: 'contains',
              }
            : {}),
          ...(filter.value === 'admins'
            ? {
                filterField: 'role',
                filterValue: 'admin',
                filterOperator: 'eq',
              }
            : {}),
          ...(filter.value === 'banned'
            ? { filterField: 'banned', filterValue: true, filterOperator: 'eq' }
            : {}),
          sortBy: sortBy.value,
          sortDirection: sortDirection.value,
          limit: pageSize,
          offset: (page.value - 1) * pageSize,
        },
      })
      if (error) {
        throw createError({
          statusCode: error.status ?? 500,
          statusMessage: error.message ?? 'Failed to load users',
        })
      }
      return result
    },
    { watch: [...filters, page] },
  )

  const users = computed(() => data.value?.users ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const pending = computed(() => reqStatus.value === 'pending')

  return {
    q,
    filter,
    sortBy,
    sortDirection,
    page,
    pageSize,
    users,
    total,
    pending,
    refresh,
  }
}
