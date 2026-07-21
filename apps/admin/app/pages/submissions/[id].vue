<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'
import type { ChangeDetail } from '@hayasedb/contract'
import { LazyConfirmModal, LazyRejectChangesetModal } from '#components'

const route = useRoute()
const api = useApiClient()
const actions = useModerationActions()
const contributionActions = useContributionActions()
const overlay = useOverlay()

const id = computed(() => String(route.params.id))

const {
  data: changeset,
  error,
  status,
  refresh,
} = useAsyncData(
  () => `admin-changeset-${id.value}`,
  () => api.changeset.get({ id: id.value }),
  { watch: [id] },
)

const detail = computed(() => changeset.value)
const loading = computed(() => status.value === 'pending' && !changeset.value)

provideContributionDisplay(() => detail.value?.display)

useSeoMeta({
  title: () =>
    detail.value ? `Submission – ${detail.value.summary}` : 'Submission',
})

const crumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Submissions', to: '/submissions' },
  ...(detail.value ? [{ label: detail.value.summary }] : []),
])

const confirmModal = overlay.create(LazyConfirmModal)
const rejectModal = overlay.create(LazyRejectChangesetModal)

async function afterDecision() {
  await refresh()
}

function askApprove() {
  const id = detail.value?.id
  if (!id) return
  confirmModal.open({
    title: 'Approve and apply?',
    description:
      'All changes in this submission are applied to the database in one transaction.',
    confirmLabel: 'Approve',
    confirmColor: 'primary',
    onConfirm: async () => {
      const result = await actions.approve(id)
      if (result) await afterDecision()
      return Boolean(result)
    },
  })
}

function askReject() {
  const current = detail.value
  if (!current) return
  rejectModal.open({
    summary: current.summary,
    onConfirm: async (reason: string) => {
      const result = await actions.reject(current.id, reason)
      if (result) await afterDecision()
      return Boolean(result)
    },
  })
}

function askRevert() {
  const id = detail.value?.id
  if (!id) return
  confirmModal.open({
    title: 'Revert this changeset?',
    description:
      'Every touched entity is restored to its pre-changeset state. Edits made after this changeset on the same fields are overwritten. History is kept.',
    confirmLabel: 'Revert',
    onConfirm: async () => {
      const result = await actions.revertChangeset(id)
      if (result) await afterDecision()
      return Boolean(result)
    },
  })
}

async function addMessage(body: string) {
  const id = detail.value?.id
  if (!id) return false
  const message = await contributionActions.addMessage(id, body)
  if (message) await refresh()
  return Boolean(message)
}

function entityLink(change: ChangeDetail): string | null {
  return change.op === 'create' ? null : `/anime/${change.entityId}`
}

function changesetPath(id: string): string {
  return `/submissions/${id}`
}

const conflicted = computed(
  () => detail.value?.changes.filter((change) => change.conflicted) ?? [],
)

const firstConflictAnchor = computed(() =>
  conflicted.value[0] ? `#change-${conflicted.value[0].id}` : null,
)

const busyAction = actions.busyAction

function isLocked(action: ModerationAction) {
  return busyAction.value !== null && busyAction.value !== action
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
      </UDashboardNavbar>
    </template>

    <template #body>
      <div
        v-if="loading"
        class="mx-auto grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <div class="order-first lg:order-last">
          <USkeleton class="h-64 w-full rounded-lg" />
        </div>
        <div class="flex min-w-0 flex-col gap-6">
          <USkeleton class="h-56 w-full rounded-lg" />
          <USkeleton class="h-40 w-full rounded-lg" />
        </div>
      </div>

      <UEmpty
        v-else-if="error || !detail"
        icon="i-lucide-circle-alert"
        title="Could not load this submission"
        :description="
          error
            ? 'Something went wrong fetching it. Try again.'
            : 'It may have been removed.'
        "
        :actions="[
          {
            label: 'Try again',
            onClick: () => refresh(),
            icon: 'i-lucide-rotate-cw',
          },
          {
            label: 'Back to submissions',
            to: '/submissions',
            color: 'neutral',
            variant: 'subtle',
          },
        ]"
      />

      <div
        v-else
        class="mx-auto grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <aside class="order-first lg:sticky lg:top-0 lg:order-last">
          <ChangesetMetaPanel
            :changeset="detail"
            :supersedes-to="
              detail.supersedesId ? `/submissions/${detail.supersedesId}` : null
            "
          >
            <template
              v-if="detail.status === 'pending' || detail.status === 'approved'"
              #actions
            >
              <template v-if="detail.status === 'pending'">
                <UButton
                  label="Approve and apply"
                  color="primary"
                  icon="i-lucide-check"
                  block
                  :loading="busyAction === 'approve'"
                  :disabled="isLocked('approve')"
                  @click="askApprove()"
                />
                <UButton
                  label="Reject"
                  color="error"
                  variant="outline"
                  icon="i-lucide-x"
                  block
                  :loading="busyAction === 'reject'"
                  :disabled="isLocked('reject')"
                  @click="askReject()"
                />
              </template>
              <UButton
                v-else-if="detail.status === 'approved'"
                label="Revert"
                color="error"
                variant="outline"
                icon="i-lucide-undo-2"
                block
                :loading="busyAction === 'revert'"
                :disabled="isLocked('revert')"
                @click="askRevert()"
              />
            </template>
          </ChangesetMetaPanel>
        </aside>

        <div class="flex min-w-0 flex-col gap-6">
          <UAlert
            v-if="conflicted.length"
            color="error"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="This submission has conflicts"
            description="The affected changes are marked below; see the activity for details. Ask the contributor to revise, or reject it."
          >
            <template v-if="firstConflictAnchor" #actions>
              <UButton
                :to="firstConflictAnchor"
                :label="`Jump to ${conflicted.length} conflicted ${conflicted.length === 1 ? 'change' : 'changes'}`"
                color="error"
                variant="link"
                size="xs"
                class="p-0"
              />
            </template>
          </UAlert>

          <ChangeCard
            v-for="change in detail.changes"
            :key="change.id"
            :change="change"
            :title="detail.summary"
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

          <ChangesetTimeline
            :changeset="detail"
            placeholder="Message the contributor…"
            :changeset-path="changesetPath"
            :on-add="addMessage"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
