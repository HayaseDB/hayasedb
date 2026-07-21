<script setup lang="ts">
import { isRevisableStatus } from '@hayasedb/domain'
import { LazyConfirmModal } from '#components'

const api = useApiClient()
const route = useRoute()
const actions = useContributionActions()
const overlay = useOverlay()

const id = computed(() => String(route.params.id))

const {
  data: changeset,
  error,
  refresh,
} = await useAsyncData(
  () => `contribution-${id.value}`,
  () => api.changeset.get({ id: id.value }),
  { watch: [id] },
)

if (error.value || !changeset.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Contribution not found',
  })
}

const detail = computed(() => changeset.value!)

provideContributionDisplay(() => detail.value.display)

const confirmModal = overlay.create(LazyConfirmModal)

function confirmWithdraw() {
  confirmModal.open({
    title: 'Withdraw this contribution?',
    description:
      'It will no longer be reviewed. You can revise and resubmit it later.',
    confirmLabel: 'Withdraw',
    onConfirm: async () => {
      const ok = await actions.withdraw(detail.value.id)
      if (ok) await refresh()
      return ok
    },
  })
}

const resubmitTo = computed(() => {
  const change = detail.value.changes[0]
  if (!change) return null
  if (change.op === 'create') {
    return `/contribute/new?from=${detail.value.id}`
  }
  if (change.op === 'update') {
    return `/contribute/anime/${change.entityId}?from=${detail.value.id}`
  }
  return null
})

const canResubmit = computed(
  () => isRevisableStatus(detail.value.status) && resubmitTo.value !== null,
)

async function addMessage(body: string) {
  const message = await actions.addMessage(detail.value.id, body)
  if (message) await refresh()
  return Boolean(message)
}

function changesetPath(id: string): string {
  return `/contributions/${id}`
}

useSeoMeta({ title: () => `Contribution – ${detail.value.summary}` })
</script>

<template>
  <UContainer class="max-w-6xl py-10">
    <UButton
      to="/contributions"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="mb-4 -ml-2"
    >
      My contributions
    </UButton>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <aside
        class="order-first lg:sticky lg:top-[calc(var(--ui-header-height)+1rem)] lg:order-last"
      >
        <ChangesetMetaPanel
          :changeset="detail"
          :supersedes-to="
            detail.supersedesId ? `/contributions/${detail.supersedesId}` : null
          "
          unknown-author-label="Moderator"
          decided-by-label="Reviewer"
        >
          <template v-if="detail.status === 'pending' || canResubmit" #actions>
            <UButton
              v-if="canResubmit && resubmitTo"
              :to="resubmitTo"
              label="Revise & resubmit"
              icon="i-lucide-pencil"
              block
            />
            <UButton
              v-if="detail.status === 'pending'"
              label="Withdraw"
              color="neutral"
              variant="outline"
              icon="i-lucide-undo-2"
              block
              :loading="actions.withdrawing.value"
              @click="confirmWithdraw()"
            />
          </template>
        </ChangesetMetaPanel>
      </aside>

      <div class="flex min-w-0 flex-col gap-6">
        <ChangeCard
          v-for="change in detail.changes"
          :key="change.id"
          :change="change"
          :title="detail.summary"
        />

        <ChangesetTimeline
          :changeset="detail"
          placeholder="Write a message to the moderators…"
          :changeset-path="changesetPath"
          unknown-author-label="Moderator"
          :on-add="addMessage"
        />
      </div>
    </div>
  </UContainer>
</template>
