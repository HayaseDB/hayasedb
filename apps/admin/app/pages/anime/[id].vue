<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import { LazyConfirmModal } from '#components'

const route = useRoute()
const api = useApiClient()
const moderation = useModerationActions()
const overlay = useOverlay()
const id = computed(() => String(route.params.id))

const submissionLink = (changesetId: string) => `/submissions/${changesetId}`

const {
  data: anime,
  error,
  refresh,
} = await useAsyncData(
  () => `admin-anime-${id.value}`,
  () => api.anime.getById({ id: id.value }),
  { watch: [id] },
)

if (error.value || !anime.value) {
  throw createError({ statusCode: 404, statusMessage: 'Anime not found' })
}

useSeoMeta({ title: () => anime.value?.slug ?? 'Anime' })

const { genres } = useGenres()

const { data: history, refresh: refreshHistory } = await useAsyncData(
  () => `admin-anime-history-${id.value}`,
  () =>
    api.revision.list({
      entityKind: 'anime',
      entityId: id.value,
      limit: 50,
      offset: 0,
    }),
  { watch: [id] },
)

const crumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Anime', to: '/anime' },
  { label: anime.value?.slug ?? '' },
])

const tabs = [
  { label: 'Edit', icon: 'i-lucide-pencil', slot: 'edit' as const },
  { label: 'History', icon: 'i-lucide-history', slot: 'history' as const },
]
const activeTab = ref('0')

const confirmModal = overlay.create(LazyConfirmModal)

async function refreshAll() {
  await Promise.all([refresh(), refreshHistory()])
}

function askRevertTo(revisionId: string) {
  const rev = history.value?.items.find((item) => item.id === revisionId)?.rev
  confirmModal.open({
    title: `Revert to revision ${rev}?`,
    description:
      'The anime is restored to that state via a new (auto-approved) changeset. Later edits on the affected fields are overwritten; history is kept.',
    confirmLabel: 'Revert',
    onConfirm: async () => {
      const result = await moderation.revertToRevision(revisionId)
      if (result) await refreshAll()
      return Boolean(result)
    },
  })
}

function askRestore() {
  const headRev = anime.value?.headRev ?? 0
  if (headRev < 2) return
  const target = history.value?.items.find((item) => item.rev === headRev - 1)
  if (!target) return
  confirmModal.open({
    title: 'Restore this anime?',
    description:
      'It was soft-deleted. Restoring re-applies its last state before deletion.',
    confirmLabel: 'Restore',
    confirmColor: 'primary',
    onConfirm: async () => {
      const result = await moderation.revertToRevision(target.id)
      if (result) await refreshAll()
      return Boolean(result)
    },
  })
}
</script>

<template>
  <UDashboardPanel id="admin-anime-edit">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <UBreadcrumb :items="crumbs" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <UAlert
          v-if="anime?.deletedAt"
          color="warning"
          variant="subtle"
          icon="i-lucide-archive"
          title="This anime is deleted"
          description="It is hidden from the public site. Its data and history are retained."
        >
          <template #actions>
            <UButton
              label="Restore"
              color="warning"
              variant="solid"
              size="xs"
              :loading="moderation.busy.value"
              @click="askRestore()"
            />
          </template>
        </UAlert>

        <UTabs v-model="activeTab" :items="tabs" variant="link">
          <template #edit>
            <AnimeFormCard
              v-if="anime"
              :anime="anime"
              :genres="genres"
              :on-saved="refreshAll"
              class="pt-4"
            />
          </template>

          <template #history>
            <div class="pt-4">
              <RevisionTimeline
                :revisions="history?.items ?? []"
                entity-kind="anime"
                :head-rev="anime?.headRev"
                :busy="moderation.busy.value"
                :on-revert="askRevertTo"
                :changeset-link="submissionLink"
              />
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>
