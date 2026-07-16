<script setup lang="ts">
import type { ChangeDetail } from '@hayasedb/contract'
const props = defineProps<{
  change: ChangeDetail
}>()
const rows = computed(() => buildDiffRows(props.change))
const showBefore = computed(() => props.change.op !== 'create')
const gridClass = computed(() =>
  showBefore.value ? 'grid-cols-[8rem_1fr_1fr]' : 'grid-cols-[8rem_1fr]',
)

function valueProps(row: ChangeDiffRow, value: unknown) {
  return {
    entityKind: props.change.entityKind,
    field: row.field,
    meta: row.meta,
    value,
  }
}
</script>

<template>
  <div
    role="table"
    class="border-default divide-default divide-y rounded-lg border"
  >
    <div
      role="row"
      class="text-muted grid items-center gap-4 px-4 py-2 text-xs font-medium tracking-wide uppercase"
      :class="gridClass"
    >
      <span role="columnheader">Field</span>
      <span v-if="showBefore" role="columnheader">Before</span>
      <span role="columnheader">
        {{ change.op === 'delete' ? 'Removed value' : 'Proposed' }}
      </span>
    </div>

    <div
      v-for="row in rows"
      :key="row.key"
      role="row"
      class="grid gap-4 px-4 py-3 text-sm"
      :class="gridClass"
    >
      <span role="rowheader" class="text-highlighted font-medium">
        {{ row.label }}
      </span>
      <div v-if="showBefore" role="cell" class="text-muted min-w-0">
        <div class="flex items-start gap-1.5">
          <span :class="row.drifted && 'opacity-60'">
            <ChangeDiffValue v-bind="valueProps(row, row.before)" />
          </span>
          <UPopover
            v-if="row.drifted"
            mode="hover"
            :open-delay="0"
            :close-delay="100"
            arrow
          >
            <UButton
              icon="i-lucide-history"
              color="warning"
              variant="ghost"
              size="xs"
              square
              aria-label="Value changed since submission"
              class="-my-1 shrink-0"
            />
            <template #content>
              <div
                class="text-muted flex max-w-xs flex-col gap-1.5 p-3 text-sm"
              >
                <p class="text-dimmed text-xs font-medium">
                  Changed since submission
                </p>
                <ChangeDiffValue v-bind="valueProps(row, row.currentValue)" />
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      <div role="cell">
        <ChangeDiffValue v-bind="valueProps(row, row.after)" />
      </div>
    </div>
  </div>
</template>
