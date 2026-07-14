<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import type { CreateGenreInput } from '@hayasedb/contract'
import type { ApiClient } from '#imports'
import { LazyConfirmModal, LazyGenreFormModal } from '#components'

type GenreListItem = Awaited<
  ReturnType<ApiClient['genre']['list']>
>['items'][number]

useSeoMeta({ title: 'Genres' })

const { genres, pending, refresh } = useGenres()
const actions = useGenreActions()

const overlay = useOverlay()
const formModal = overlay.create(LazyGenreFormModal)
const confirmModal = overlay.create(LazyConfirmModal)

async function submitForm(
  genre: GenreListItem | null,
  data: CreateGenreInput,
): Promise<boolean> {
  const ok = genre
    ? await actions.update({ id: genre.id, ...data })
    : await actions.create(data)
  if (ok) await refresh()
  return ok
}

function openCreate() {
  formModal.open({
    genre: null,
    onSubmit: (data) => submitForm(null, data),
  })
}

function openEdit(genre: GenreListItem) {
  formModal.open({
    genre,
    onSubmit: (data) => submitForm(genre, data),
  })
}

function askDelete(genre: GenreListItem) {
  confirmModal.open({
    title: 'Delete genre',
    description: `Delete “${genre.name}”? This cannot be undone.`,
    confirmLabel: 'Delete',
    onConfirm: async () => {
      const ok = await actions.remove(genre.id)
      if (ok) await refresh()
      return ok
    },
  })
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const columns: TableColumn<GenreListItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-highlighted text-sm font-medium' },
        row.original.name,
      ),
  },
  {
    accessorKey: 'animeCount',
    header: 'Anime',
    meta: { class: { th: 'w-24', td: 'w-24' } },
    cell: ({ row }) =>
      h(UBadge, {
        label: String(row.original.animeCount),
        color: 'neutral',
        variant: 'subtle',
      }),
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { th: 'w-12', td: 'w-12' } },
    cell: ({ row }) => {
      const menuItems: DropdownMenuItem[][] = [
        [
          {
            label: 'Edit',
            icon: 'i-lucide-pencil',
            onSelect: () => openEdit(row.original),
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
</script>

<template>
  <UDashboardPanel id="admin-genres">
    <template #header>
      <UDashboardNavbar title="Genres">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="New genre"
            color="primary"
            @click="openCreate"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <UTable
          :data="genres"
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
              <UIcon name="i-lucide-tag" class="size-6" />
              <p class="text-sm">No genres yet.</p>
            </div>
          </template>
        </UTable>
      </div>
    </template>
  </UDashboardPanel>
</template>
