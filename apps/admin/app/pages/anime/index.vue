<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { ApiClient } from '#imports'
import { LazyConfirmModal } from '#components'

type AnimeListItem = Awaited<
  ReturnType<ApiClient['anime']['list']>
>['items'][number]

useSeoMeta({ title: 'Anime' })

const {
  q,
  format,
  status,
  genre,
  sort,
  page,
  pageSize,
  genres,
  items,
  total,
  pending,
  refresh,
  hasFilters,
  resetFilters,
} = await useAnimeList({
  key: 'admin-anime-list',
  pageSize: 20,
})

const actions = useAnimeActions()

function toggleTitleSort() {
  if (sort.value === 'title') {
    sort.value = '-title'
  } else if (sort.value === '-title') {
    sort.value = '-createdAt'
  } else {
    sort.value = 'title'
  }
}

const titleSortIcon = computed(() => {
  if (sort.value === 'title') return 'i-lucide-arrow-up'
  if (sort.value === '-title') return 'i-lucide-arrow-down'
  return 'i-lucide-arrow-down-up'
})

const overlay = useOverlay()
const confirmModal = overlay.create(LazyConfirmModal)

function askDelete(item: AnimeListItem) {
  confirmModal.open({
    title: 'Delete anime',
    description: `Delete “${item.slug}”? This cannot be undone.`,
    confirmLabel: 'Delete',
    onConfirm: async () => {
      const ok = await actions.remove(item.id)
      if (ok) await refresh()
      return ok
    },
  })
}

const UButton = resolveComponent('UButton')
const ULink = resolveComponent('ULink')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const AnimeCoverImage = resolveComponent('AnimeCoverImage')

const columns: TableColumn<AnimeListItem>[] = [
  {
    accessorKey: 'coverUrl',
    header: '',
    enableHiding: false,
    meta: { class: { th: 'min-w-16', td: 'min-w-16' } },
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
      h(
        UButton,
        tableSortHeaderProps({
          label: 'Title',
          icon: titleSortIcon.value,
          onClick: toggleTitleSort,
        }),
      ),
    meta: { class: { th: 'min-w-56', td: 'max-w-80 min-w-56' } },
    cell: ({ row }) =>
      h('div', { class: 'flex min-w-0 flex-col' }, [
        h(
          ULink,
          {
            to: `/anime/${row.original.id}`,
            class:
              'text-highlighted truncate text-sm font-medium hover:underline',
          },
          () => row.original.titleEnglish ?? '',
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
    meta: { class: { th: 'min-w-24', td: 'min-w-24' } },
    cell: ({ row }) => {
      const label = animeFormatLabel(row.original.format)
      if (!label) return null
      return h('span', { class: 'text-sm' }, label)
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    meta: { class: { th: 'min-w-36', td: 'min-w-36' } },
    cell: ({ row }) => {
      const label = animeStatusLabel(row.original.status)
      if (!label) return null
      return h(UBadge, {
        label,
        color: animeStatusColor(row.original.status),
        variant: 'subtle',
      })
    },
  },
  {
    id: 'genres',
    accessorKey: 'genres',
    header: 'Genres',
    meta: { class: { th: 'min-w-56', td: 'min-w-56' } },
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted line-clamp-1 text-sm' },
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
  { id: 'status', label: 'Status' },
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
          v-model:genre="genre"
          :genres="genres"
        >
          <template #trailing>
            <UDropdownMenu :items="columnItems" :content="{ align: 'end' }">
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

        <div class="flex h-5 items-center gap-3">
          <p class="text-muted text-sm">
            {{ total }} {{ total === 1 ? 'title' : 'titles' }}
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
          :data="items"
          :columns="columns"
          :loading="pending"
          class="border-default flex-1 rounded-lg border"
          :ui="TABLE_UI"
        >
          <template #empty>
            <UEmpty
              variant="naked"
              icon="i-lucide-search-x"
              :title="hasFilters ? 'No anime found' : 'No anime yet'"
              :description="
                hasFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Add the first anime to get started.'
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
