<script setup lang="ts">
import type { ChangesetDetail } from '@hayasedb/contract'

const props = withDefaults(
  defineProps<{
    changeset: ChangesetDetail
    supersedesTo?: string | null
    unknownAuthorLabel?: string
    decidedByLabel?: string
  }>(),
  {
    supersedesTo: null,
    unknownAuthorLabel: '(deleted user)',
    decidedByLabel: 'Reviewer',
  },
)

defineSlots<{
  actions?: () => unknown
}>()

const author = computed(() => ({
  name: props.changeset.author.name ?? props.unknownAuthorLabel,
  description: props.changeset.submittedAt
    ? `Submitted ${formatRelativeTime(props.changeset.submittedAt)}`
    : undefined,
  avatar: {
    src: props.changeset.author.image ?? undefined,
    alt: props.changeset.author.name ?? 'User',
  },
}))

const reviewer = computed(() => {
  const person = props.changeset.decidedBy
  if (!person) return null
  return {
    name: person.name ?? props.unknownAuthorLabel,
    description: props.changeset.decidedAt
      ? `Reviewed ${formatRelativeTime(props.changeset.decidedAt)}`
      : undefined,
    avatar: { src: person.image ?? undefined, alt: person.name ?? 'User' },
  }
})

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copyId() {
  try {
    await navigator.clipboard.writeText(props.changeset.id)
  } catch {
    return
  }
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copied.value = false
  }, 1500)
}

onUnmounted(() => clearTimeout(copyTimer))
</script>

<template>
  <UPageCard variant="subtle" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
    <dl class="flex min-w-0 flex-col gap-4">
      <div class="flex min-w-0 items-center justify-between gap-3">
        <dt class="text-muted text-sm font-medium">Status</dt>
        <dd class="min-w-0">
          <ChangesetStatusBadge :status="changeset.status" />
        </dd>
      </div>

      <USeparator />

      <div class="flex min-w-0 flex-col gap-2">
        <dt class="text-muted text-sm font-medium">Summary</dt>
        <dd class="text-highlighted min-w-0 text-sm">
          {{ changeset.summary }}
        </dd>
      </div>

      <USeparator />

      <div class="flex min-w-0 flex-col gap-2">
        <dt class="text-muted text-sm font-medium">Author</dt>
        <dd class="min-w-0">
          <UUser v-bind="author" size="md" />
        </dd>
      </div>

      <USeparator />

      <div class="flex min-w-0 flex-col gap-2">
        <dt class="text-muted text-sm font-medium">{{ decidedByLabel }}</dt>
        <dd class="text-dimmed min-w-0 text-sm">
          <UUser v-if="reviewer" v-bind="reviewer" size="md" />
          <template v-else>Not reviewed yet</template>
        </dd>
      </div>

      <template v-if="supersedesTo">
        <USeparator />

        <div class="flex min-w-0 flex-col gap-2">
          <dt class="text-muted text-sm font-medium">Revision of</dt>
          <dd class="min-w-0">
            <ULink :to="supersedesTo" class="text-sm">
              An earlier submission
            </ULink>
          </dd>
        </div>
      </template>

      <USeparator />

      <div class="flex min-w-0 flex-col gap-2">
        <dt class="text-muted text-sm font-medium">ID</dt>
        <dd class="flex min-w-0 items-center gap-1">
          <span class="text-dimmed min-w-0 flex-1 truncate text-sm">
            {{ changeset.id }}
          </span>
          <UButton
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :color="copied ? 'success' : 'neutral'"
            variant="ghost"
            size="xs"
            class="shrink-0"
            :aria-label="copied ? 'Copied' : 'Copy ID'"
            @click="copyId()"
          />
        </dd>
      </div>
    </dl>

    <template v-if="$slots.actions">
      <USeparator />

      <div class="flex min-w-0 flex-col gap-2">
        <slot name="actions" />
      </div>
    </template>
  </UPageCard>
</template>
