<script setup lang="ts">
import type { ChangeDetail } from '@hayasedb/contract'

defineProps<{ change: ChangeDetail; title?: string }>()

defineSlots<{
  actions?: () => unknown
}>()
</script>

<template>
  <UPageCard
    :id="`change-${change.id}`"
    variant="subtle"
    :class="change.conflicted && 'ring-error/30 ring-1'"
  >
    <template #header>
      <div class="flex w-full flex-wrap items-center gap-2">
        <UBadge
          :label="CHANGE_OP_LABELS[change.op]"
          :color="CHANGE_OP_COLORS[change.op]"
          variant="subtle"
        />
        <span class="text-highlighted min-w-0 truncate font-medium">
          {{ title ?? change.entityLabel }}
        </span>
        <UBadge
          v-if="change.conflicted"
          label="Conflict"
          color="error"
          variant="subtle"
        />
        <span class="flex-1" />
        <slot name="actions" />
      </div>
    </template>
    <ChangeDiffTable :change="change" />
  </UPageCard>
</template>
