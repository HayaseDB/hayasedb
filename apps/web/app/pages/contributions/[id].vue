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

async function addNote(body: string) {
  const note = await actions.addNote(detail.value.id, body)
  if (note) await refresh()
  return Boolean(note)
}

useSeoMeta({ title: () => `Contribution – ${detail.value.summary}` })
</script>

<template>
  <UContainer class="max-w-4xl py-10">
    <UButton
      to="/contributions"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="mb-4 -ml-2"
    >
      My contributions
    </UButton>

    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-3">
          <ChangesetStatusBadge :status="detail.status" />
          <span class="text-muted text-xs">
            Submitted {{ formatDateTime(detail.submittedAt) }}
          </span>
          <span v-if="detail.decidedAt" class="text-muted text-xs">
            · Decided {{ formatDateTime(detail.decidedAt) }}
          </span>
        </div>
        <h1 class="text-highlighted text-xl font-semibold">
          {{ detail.summary }}
        </h1>
        <p v-if="detail.supersedesId" class="text-muted text-xs">
          Revision of
          <ULink
            :to="`/contributions/${detail.supersedesId}`"
            class="text-primary"
          >
            an earlier submission
          </ULink>
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          v-if="detail.status === 'pending'"
          label="Withdraw"
          color="neutral"
          variant="outline"
          icon="i-lucide-undo-2"
          @click="confirmWithdraw()"
        />
        <UButton
          v-if="canResubmit && resubmitTo"
          :to="resubmitTo"
          label="Revise & resubmit"
          icon="i-lucide-pencil"
        />
      </div>
    </div>

    <div class="flex flex-col gap-6">
      <ChangeCard
        v-for="change in detail.changes"
        :key="change.id"
        :change="change"
      />

      <ChangesetNotes
        title="Discussion"
        :notes="detail.notes"
        placeholder="Write a note to the moderators…"
        unknown-author-label="Moderator"
        :on-add="addNote"
      />
    </div>
  </UContainer>
</template>
