<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { ChangeDetail } from '@hayasedb/contract'
import { LazyConfirmModal, LazyRejectChangesetModal } from '#components'

const route = useRoute()
const api = useApiClient()
const actions = useModerationActions()
const contributionActions = useContributionActions()
const { refresh: refreshCounts } = useModerationCounts()
const overlay = useOverlay()

const id = computed(() => String(route.params.id))

const {
  data: changeset,
  error,
  refresh,
} = await useAsyncData(
  () => `admin-changeset-${id.value}`,
  () => api.changeset.get({ id: id.value }),
  { watch: [id] },
)

if (error.value || !changeset.value) {
  throw createError({ statusCode: 404, statusMessage: 'Submission not found' })
}

const detail = computed(() => changeset.value!)

provideContributionDisplay(() => detail.value.display)

useSeoMeta({ title: () => `Submission – ${detail.value.summary}` })

const crumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Submissions', to: '/submissions' },
  { label: detail.value.summary },
])

const confirmModal = overlay.create(LazyConfirmModal)
const rejectModal = overlay.create(LazyRejectChangesetModal)

async function afterDecision() {
  await Promise.all([refresh(), refreshCounts()])
}

function askApprove() {
  confirmModal.open({
    title: 'Approve and apply?',
    description:
      'All changes in this submission are applied to the database in one transaction.',
    confirmLabel: 'Approve',
    confirmColor: 'primary',
    onConfirm: async () => {
      const result = await actions.approve(detail.value.id)
      if (result) await afterDecision()
      return Boolean(result)
    },
  })
}

function askReject() {
  rejectModal.open({
    summary: detail.value.summary,
    onConfirm: async (note: string) => {
      const result = await actions.reject(detail.value.id, note)
      if (result) await afterDecision()
      return Boolean(result)
    },
  })
}

function askRevert() {
  confirmModal.open({
    title: 'Revert this changeset?',
    description:
      'Every touched entity is restored to its pre-changeset state. Edits made after this changeset on the same fields are overwritten. History is kept.',
    confirmLabel: 'Revert',
    onConfirm: async () => {
      const result = await actions.revertChangeset(detail.value.id)
      if (result) await afterDecision()
      return Boolean(result)
    },
  })
}

async function addNote(body: string) {
  const note = await contributionActions.addNote(detail.value.id, body)
  if (note) await refresh()
  return Boolean(note)
}

function entityLink(change: ChangeDetail): string | null {
  return change.op === 'create' ? null : `/anime/${change.entityId}`
}
</script>

<template>
  <UDashboardPanel id="admin-submission-review">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <UBreadcrumb :items="crumbs" />
        </template>
        <template #right>
          <template v-if="detail.status === 'pending'">
            <UButton
              label="Reject"
              color="error"
              variant="outline"
              icon="i-lucide-x"
              :loading="actions.busy.value"
              @click="askReject()"
            />
            <UButton
              label="Approve"
              color="primary"
              icon="i-lucide-check"
              :loading="actions.busy.value"
              @click="askApprove()"
            />
          </template>
          <UButton
            v-else-if="detail.status === 'approved'"
            label="Revert"
            color="error"
            variant="outline"
            icon="i-lucide-undo-2"
            :loading="actions.busy.value"
            @click="askRevert()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-3">
            <ChangesetStatusBadge :status="detail.status" />
            <span class="flex items-center gap-2 text-sm">
              <UAvatar
                :src="detail.author.image ?? undefined"
                :alt="detail.author.name ?? 'User'"
                size="2xs"
              />
              {{ detail.author.name ?? '(deleted user)' }}
            </span>
            <span class="text-muted text-xs">
              Submitted {{ formatDateTime(detail.submittedAt) }}
            </span>
            <span v-if="detail.decidedAt" class="text-muted text-xs">
              · Decided {{ formatDateTime(detail.decidedAt) }}
              <template v-if="detail.decidedBy?.name">
                by {{ detail.decidedBy.name }}
              </template>
            </span>
          </div>
          <h1 class="text-highlighted text-xl font-semibold">
            {{ detail.summary }}
          </h1>
          <p v-if="detail.supersedesId" class="text-muted text-xs">
            Revision of
            <ULink
              :to="`/submissions/${detail.supersedesId}`"
              class="text-primary"
            >
              an earlier submission
            </ULink>
          </p>
        </div>

        <UAlert
          v-if="detail.changes.some((c) => c.conflicted)"
          color="error"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          title="This submission has conflicts"
          description="The affected changes are marked below; see the notes for details. Ask the contributor to revise, or reject it."
        />

        <ChangeCard
          v-for="change in detail.changes"
          :key="change.id"
          :change="change"
        >
          <template #actions>
            <UButton
              v-if="entityLink(change)"
              :to="entityLink(change)!"
              label="Open entity"
              icon="i-lucide-external-link"
              color="neutral"
              variant="ghost"
              size="xs"
            />
          </template>
        </ChangeCard>

        <ChangesetNotes
          :notes="detail.notes"
          placeholder="Message the contributor…"
          :on-add="addNote"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
