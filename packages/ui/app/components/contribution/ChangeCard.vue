<script setup lang="ts">
import type { ChangeDetail } from '@hayasedb/contract'

defineProps<{ change: ChangeDetail }>()

defineSlots<{
  actions?: () => unknown
}>()
</script>

<template>
  <UPageCard variant="subtle">
    <template #header>
      <div class="flex w-full flex-wrap items-center gap-2">
        <UBadge
          :label="CHANGE_OP_LABELS[change.op]"
          :color="CHANGE_OP_COLORS[change.op]"
          variant="subtle"
        />
        <span class="text-highlighted font-medium">
          {{ change.entityLabel }}
        </span>
        <UBadge
          v-if="change.conflicted"
          label="Conflict"
          color="error"
          variant="subtle"
        />
        <span v-if="change.baseRev" class="text-muted text-xs">
          based on r{{ change.baseRev
          }}<template v-if="change.headRev !== change.baseRev">
            · head is r{{ change.headRev }}</template
          >
        </span>
        <span class="flex-1" />
        <slot name="actions" />
      </div>
    </template>
    <ChangeDiffTable :change="change" />
  </UPageCard>
</template>
