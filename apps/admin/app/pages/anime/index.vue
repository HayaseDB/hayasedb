<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { ApiClient } from '#imports'

type AnimeListItem = Awaited<
  ReturnType<ApiClient['anime']['list']>
>['items'][number]

useSeoMeta({ title: 'Anime' })

const {
  q,
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
} = useAnimeList({ key: 'admin-anime-list', pageSize: 20 })

const actions = useAnimeActions()

function toggleTitleSort() {
  if (sort.value !== 'title') {
    sort.value = 'title'
    order.value = 'asc'
  } else if (order.value === 'asc') {
    order.value = 'desc'
  } else {
    sort.value = 'recent'
    order.value = 'desc'
  }
}

const titleSortIcon = computed(() => {
  if (sort.value !== 'title') return 'i-lucide-arrow-down-up'
  return order.value === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
})

const {
  target: deleteTarget,
  open: deleteOpen,
  deleting,
  ask: askDelete,
  confirm: confirmDelete,
} = useConfirmDelete<AnimeListItem>(async (item) => {
  const ok = await actions.remove(item.id)
  if (ok) await refresh()
  return ok
})

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const AnimeCoverImage = resolveComponent('AnimeCoverImage')
const AnimeBadges = resolveComponent('AnimeBadges')

const columns: TableColumn<AnimeListItem>[] = [
  {
    accessorKey: 'coverUrl',
    header: '',
    enableHiding: false,
    meta: { class: { th: 'w-16', td: 'w-16' } },
    cell: ({ row }) =>
      h(AnimeCoverImage, {
        src: row.original.coverUrl,
        alt: row.original.titleEnglish ?? undefined,
        class: 'aspect-[2/3] h-10 shrink-0 rounded',
      }),
  },
  {
    id: 'title',
    accessorKey: 'titleRomaji',
    header: () =>
      h(UButton, {
        label: 'Title',
        color: 'neutral',
        variant: 'ghost',
        size: 'sm',
        class: '-mx-2',
        trailingIcon: titleSortIcon.value,
        onClick: toggleTitleSort,
      }),
    cell: ({ row }) =>
      h('div', { class: 'flex min-w-0 flex-col' }, [
        h(
          'span',
          { class: 'text-highlighted truncate text-sm font-medium' },
          row.original.titleEnglish ?? '',
        ),
        h(
          'span',
          { class: 'text-muted truncate text-xs' },
          `/${row.original.slug}`,
        ),
      ]),
  },
  {
    id: 'format',
    accessorKey: 'format',
    header: 'Format',
    meta: { class: { th: 'w-44', td: 'w-44' } },
    cell: ({ row }) =>
      h(AnimeBadges, {
        format: row.original.format,
        status: row.original.status,
      }),
  },
  {
    id: 'genres',
    accessorKey: 'genres',
    header: 'Genres',
    meta: { class: { th: 'w-56', td: 'w-56' } },
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted line-clamp-1 text-xs' },
        row.original.genres.join(', '),
      ),
  },
  {
    id: 'actions',
    header: '',
    enableHiding: false,
    meta: { class: { th: 'w-12', td: 'w-12' } },
    cell: ({ row }) => {
      const menuItems: DropdownMenuItem[][] = [
        [
          {
            label: 'Edit',
            icon: 'i-lucide-pencil',
            onSelect: () => navigateTo(`/anime/${row.original.id}`),
          },
          {
            label: 'Delete',
            icon: 'i-lucide-trash-2',
            color: 'error',
            onSelect: () => askDelete(row.original),
          },
        ],
      ]
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
  { id: 'title', label: 'Title' },
  { id: 'format', label: 'Format' },
  { id: 'genres', label: 'Genres' },
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
  <UDashboardPanel id="admin-anime">
    <template #header>
      <UDashboardNavbar title="Anime">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            to="/anime/new"
            icon="i-lucide-plus"
            label="New anime"
            color="primary"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <AnimeFilterBar
          v-model:q="q"
          v-model:format="format"
          v-model:status="status"
          v-model:genre-id="genreId"
          :genres="genres"
        >
          <template #trailing>
            <UDropdownMenu
              :items="columnItems"
              :content="{ align: 'end' }"
              class="sm:ml-auto"
            >
              <UButton
                label="Columns"
                icon="i-lucide-columns-3"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-chevron-down"
              />
            </UDropdownMenu>
          </template>
        </AnimeFilterBar>

        <UTable
          v-model:column-visibility="columnVisibility"
          :data="items"
          :columns="columns"
          :loading="pending"
          class="border-default flex-1 rounded-lg border"
          :ui="{
            base: 'table-fixed',
            thead: 'bg-elevated/50',
            tbody: '[&>tr:last-child>td]:border-b-0',
            td: 'empty:p-0',
          }"
        >
          <template #empty>
            <div
              class="text-muted flex flex-col items-center gap-2 py-16 text-center"
            >
              <UIcon name="i-lucide-search-x" class="size-6" />
              <p class="text-sm">No anime found.</p>
            </div>
          </template>
        </UTable>

        <div v-if="total > pageSize" class="flex justify-center">
          <UPagination
            v-model:page="page"
            :items-per-page="pageSize"
            :total="total"
          />
        </div>

        <ConfirmModal
          v-model:open="deleteOpen"
          title="Delete anime"
          :description="`Delete “${deleteTarget?.slug ?? ''}”? This cannot be undone.`"
          confirm-label="Delete"
          :loading="deleting"
          @confirm="confirmDelete"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
