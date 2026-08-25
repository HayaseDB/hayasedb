<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { ApiClient } from '#imports'
import {
  LazyConfirmModal,
  LazyUserBanModal,
  LazyUserCreateModal,
} from '#components'

type AdminUser = Awaited<
  ReturnType<ApiClient['auth']['admin']['listUsers']>
>['users'][number]

useSeoMeta({ title: 'Users' })

const {
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
  hasFilters,
  resetFilters,
} = useAdminUsers({ key: 'admin-users-list', pageSize: 20 })

const actions = useAdminUserActions()

const { data: session } = await useAppSession()
const currentUserId = computed(() => session.value?.user.id ?? null)

const filterItems = [
  { label: 'Admins', value: 'admins' },
  { label: 'Banned', value: 'banned' },
] as const

function toggleSort(column: 'name' | 'createdAt') {
  if (sortBy.value !== column) {
    sortBy.value = column
    sortDirection.value = column === 'name' ? 'asc' : 'desc'
  } else if (sortDirection.value === 'asc') {
    sortDirection.value = 'desc'
  } else {
    sortDirection.value = 'asc'
  }
}

function sortIcon(column: 'name' | 'createdAt') {
  if (sortBy.value !== column) return 'i-lucide-arrow-down-up'
  return sortDirection.value === 'asc'
    ? 'i-lucide-arrow-up'
    : 'i-lucide-arrow-down'
}

const overlay = useOverlay()
const createModal = overlay.create(LazyUserCreateModal)
const banModal = overlay.create(LazyUserBanModal)
const confirmModal = overlay.create(LazyConfirmModal)

function openCreate() {
  createModal.open({
    onSubmit: async (data) => {
      const ok = await actions.createUser(data)
      if (ok) await refresh()
      return ok
    },
  })
}

function askBan(user: AdminUser) {
  banModal.open({
    userName: user.name,
    onSubmit: async (data) => {
      const ok = await actions.banUser(user.id, data)
      if (ok) await refresh()
      return ok
    },
  })
}

async function unban(user: AdminUser) {
  if (await actions.unbanUser(user.id)) await refresh()
}

function askDelete(user: AdminUser) {
  confirmModal.open({
    title: 'Delete user',
    description: `Permanently delete “${user.email}” and all associated data? This cannot be undone.`,
    confirmLabel: 'Delete',
    onConfirm: async () => {
      const ok = await actions.removeUser(user.id)
      if (ok) await refresh()
      return ok
    },
  })
}

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const NuxtTime = resolveComponent('NuxtTime')

const columns: TableColumn<AdminUser>[] = [
  {
    id: 'user',
    accessorKey: 'name',
    enableHiding: false,
    header: () =>
      h(
        UButton,
        tableSortHeaderProps({
          label: 'User',
          icon: sortIcon('name'),
          onClick: () => toggleSort('name'),
        }),
      ),
    meta: { class: { th: 'min-w-56', td: 'max-w-80 min-w-56' } },
    cell: ({ row }) =>
      h('div', { class: 'flex min-w-0 items-center gap-3' }, [
        h(UAvatar, {
          src: row.original.image ?? undefined,
          alt: row.original.name,
          size: 'md',
        }),
        h('div', { class: 'flex min-w-0 flex-col' }, [
          h('div', { class: 'flex items-center gap-2' }, [
            h(
              'span',
              { class: 'text-highlighted truncate text-sm font-medium' },
              row.original.name,
            ),
            row.original.id === currentUserId.value
              ? h(UBadge, {
                  label: 'You',
                  color: 'primary',
                  variant: 'subtle',
                  size: 'sm',
                })
              : null,
          ]),
          h(
            'span',
            { class: 'text-muted truncate text-xs' },
            row.original.email,
          ),
        ]),
      ]),
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: 'Role',
    meta: { class: { th: 'min-w-28', td: 'min-w-28' } },
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.role === 'admin' ? 'Admin' : 'User',
        color: row.original.role === 'admin' ? 'primary' : 'neutral',
        variant: 'subtle',
      }),
  },
  {
    id: 'status',
    accessorKey: 'banned',
    header: 'Status',
    meta: { class: { th: 'min-w-32', td: 'min-w-32' } },
    cell: ({ row }) => {
      if (row.original.banned) {
        return h(UBadge, { label: 'Banned', color: 'error', variant: 'subtle' })
      }
      return row.original.emailVerified
        ? h(UBadge, { label: 'Verified', color: 'success', variant: 'subtle' })
        : h(UBadge, {
            label: 'Unverified',
            color: 'warning',
            variant: 'subtle',
          })
    },
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    meta: { class: { th: 'min-w-36', td: 'min-w-36' } },
    header: () =>
      h(
        UButton,
        tableSortHeaderProps({
          label: 'Joined',
          icon: sortIcon('createdAt'),
          onClick: () => toggleSort('createdAt'),
        }),
      ),
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted text-sm' },
        h(NuxtTime, {
          datetime: row.original.createdAt,
          dateStyle: 'medium',
          locale: 'en',
        }),
      ),
  },
  {
    id: 'actions',
    header: '',
    enableHiding: false,
    meta: { class: { th: 'w-12', td: 'w-12' } },
    cell: ({ row }) => {
      const user = row.original
      const isSelf = user.id === currentUserId.value

      const manageItems: DropdownMenuItem[] = [
        {
          label: 'Manage',
          icon: 'i-lucide-user-cog',
          onSelect: () => navigateTo(`/users/${user.id}`),
        },
      ]

      const dangerItems: DropdownMenuItem[] = []
      if (!isSelf) {
        dangerItems.push(
          user.banned
            ? {
                label: 'Unban',
                icon: 'i-lucide-shield-check',
                onSelect: () => unban(user),
              }
            : {
                label: 'Ban',
                icon: 'i-lucide-shield-ban',
                color: 'error',
                onSelect: () => askBan(user),
              },
          {
            label: 'Delete',
            icon: 'i-lucide-trash-2',
            color: 'error',
            onSelect: () => askDelete(user),
          },
        )
      }

      const menuItems: DropdownMenuItem[][] = dangerItems.length
        ? [manageItems, dangerItems]
        : [manageItems]

      return h(
        'div',
        { class: 'flex justify-end' },
        h(UDropdownMenu, { items: menuItems, content: { align: 'end' } }, () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'sm',
            square: true,
          }),
        ),
      )
    },
  },
]

const hideableColumns = [
  { id: 'role', label: 'Role' },
  { id: 'status', label: 'Status' },
  { id: 'createdAt', label: 'Joined' },
]
const columnVisibility = ref<Record<string, boolean>>({})
const columnItems = computed<DropdownMenuItem[]>(() =>
  hideableColumns.map((column) => ({
    label: column.label,
    type: 'checkbox' as const,
    checked: columnVisibility.value[column.id] !== false,
    onUpdateChecked(checked: boolean) {
      columnVisibility.value = {
        ...columnVisibility.value,
        [column.id]: checked,
      }
    },
    onSelect(event: Event) {
      event.preventDefault()
    },
  })),
)
</script>

<template>
  <UDashboardPanel id="admin-users">
    <template #header>
      <UDashboardNavbar title="Users">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="New user"
            color="primary"
            @click="openCreate"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <UInput
            v-model="q"
            icon="i-lucide-search"
            placeholder="Search name or email…"
            aria-label="Search users"
            class="w-full sm:w-64 sm:shrink-0"
          />
          <AppSelect
            v-model="filter"
            :items="filterItems"
            value-key="value"
            placeholder="All users"
            aria-label="User filter"
            class="w-full sm:w-40"
          />
          <div class="flex items-center gap-2 sm:ms-auto sm:shrink-0">
            <UDropdownMenu :items="columnItems" :content="{ align: 'end' }">
              <UButton
                label="Columns"
                icon="i-lucide-columns-3"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-chevron-down"
                class="w-full sm:w-auto"
              />
            </UDropdownMenu>
          </div>
        </div>

        <div class="flex h-5 items-center gap-3">
          <p class="text-muted text-sm">
            {{ total }} {{ total === 1 ? 'user' : 'users' }}
          </p>
          <UButton
            v-if="hasFilters"
            label="Reset filters"
            icon="i-lucide-x"
            color="neutral"
            variant="link"
            size="xs"
            :ui="{ base: 'py-0', leadingIcon: 'size-3.5' }"
            @click="resetFilters()"
          />
        </div>

        <UTable
          v-model:column-visibility="columnVisibility"
          :data="users"
          :columns="columns"
          :loading="pending"
          class="border-default flex-1 rounded-lg border"
          :ui="TABLE_UI"
        >
          <template #empty>
            <UEmpty
              variant="naked"
              icon="i-lucide-search-x"
              :title="hasFilters ? 'No users found' : 'No users yet'"
              :description="
                hasFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Users appear here once they register.'
              "
              :actions="
                hasFilters
                  ? [
                      {
                        label: 'Reset filters',
                        color: 'neutral',
                        variant: 'outline',
                        onClick: () => resetFilters(),
                      },
                    ]
                  : undefined
              "
            />
          </template>
        </UTable>

        <div v-if="total > pageSize" class="flex justify-center">
          <UPagination
            v-model:page="page"
            :items-per-page="pageSize"
            :total="total"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
