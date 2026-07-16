<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { CHANGESET_STATUSES } from '@hayasedb/domain'
import type { ApiClient } from '#imports'

type ChangesetRow = Awaited<
  ReturnType<ApiClient['changeset']['list']>
>['items'][number]

useSeoMeta({ title: 'Submissions' })

const router = useRouter()
const { status, page, pageSize, items, total, pending } = useModerationQueue()

const statusTabs = CHANGESET_STATUSES.filter((value) => value !== 'draft').map(
  (value) => ({ label: CHANGESET_STATUS_LABELS[value], value }),
)

const ChangesetStatusBadge = resolveComponent('ChangesetStatusBadge')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<ChangesetRow>[] = [
  {
    accessorKey: 'summary',
    header: 'Summary',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-highlighted text-sm font-medium' },
        row.original.summary,
      ),
  },
  {
    id: 'entities',
    header: 'Entities',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted text-sm' },
        row.original.entityLabels.join(', '),
      ),
  },
  {
    accessorKey: 'author',
    header: 'Author',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-sm' },
        row.original.author.name ?? '(deleted user)',
      ),
  },
  {
    accessorKey: 'changeCount',
    header: 'Changes',
    meta: { class: { th: 'w-24', td: 'w-24' } },
    cell: ({ row }) =>
      h(UBadge, {
        label: String(row.original.changeCount),
        color: 'neutral',
        variant: 'subtle',
      }),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { class: { th: 'w-36', td: 'w-36' } },
    cell: ({ row }) => h(ChangesetStatusBadge, { status: row.original.status }),
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted',
    meta: { class: { th: 'w-44', td: 'w-44' } },
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted text-sm' },
        row.original.submittedAt
          ? formatDateTime(row.original.submittedAt)
          : '—',
      ),
  },
]
</script>

<template>
  <UDashboardPanel id="admin-submissions">
    <template #header>
      <UDashboardNavbar title="Submissions">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <UTabs
          v-model="status"
          :items="statusTabs"
          :content="false"
          size="sm"
          class="w-fit"
        />

        <UTable
          :data="items"
          :columns="columns"
          :loading="pending"
          class="border-default rounded-lg border"
          :ui="{ tr: 'cursor-pointer' }"
          @select="
            (_e, row) => {
              if (row) router.push(`/submissions/${row.original.id}`)
            }
          "
        />

        <div v-if="total > pageSize" class="flex justify-center">
          <UPagination
            v-model:page="page"
            :total="total"
            :items-per-page="pageSize"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
