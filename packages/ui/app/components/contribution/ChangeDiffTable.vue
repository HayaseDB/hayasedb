<script setup lang="ts">
import type { ChangeDetail } from '@hayasedb/contract'
const props = defineProps<{
  change: ChangeDetail
}>()
const rows = computed(() => buildDiffRows(props.change))
const showBefore = computed(() => props.change.op !== 'create')
const isDelete = computed(() => props.change.op === 'delete')
const gridClass = computed(() =>
  showBefore.value
    ? 'grid-cols-1 md:grid-cols-[10rem_1fr_1fr]'
    : 'grid-cols-1 md:grid-cols-[10rem_1fr]',
)

const afterHeader = computed(() =>
  isDelete.value ? 'Removed value' : 'Proposed',
)

const afterTintClass = computed(() =>
  isDelete.value ? 'bg-error/5 text-toned' : 'bg-success/5 text-highlighted',
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
      class="text-muted hidden items-center gap-4 px-4 py-2.5 text-xs font-medium md:grid"
      :class="gridClass"
    >
      <span role="columnheader">Field</span>
      <span v-if="showBefore" role="columnheader">Before</span>
      <span role="columnheader">{{ afterHeader }}</span>
    </div>

    <div
      v-for="row in rows"
      :key="row.key"
      role="row"
      class="grid items-start gap-x-4 gap-y-2 px-2 py-3 text-sm"
      :class="gridClass"
    >
      <span role="rowheader" class="text-muted px-2 text-sm md:pt-1">
        {{ row.label }}
      </span>

      <div
        v-if="showBefore"
        role="cell"
        class="text-muted min-w-0 rounded px-2 py-1"
        :class="row.changed && 'bg-error/5'"
      >
        <span class="text-muted mb-0.5 block text-xs md:hidden">Before</span>
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
            <UIcon
              name="i-lucide-history"
              class="text-warning mt-0.5 size-4 shrink-0 cursor-help"
              aria-label="Value changed since submission"
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

      <div
        role="cell"
        class="min-w-0 rounded px-2 py-1"
        :class="row.changed && afterTintClass"
      >
        <span class="text-muted mb-0.5 block text-xs md:hidden">
          {{ afterHeader }}
        </span>
        <ChangeDiffValue v-bind="valueProps(row, row.after)" />
      </div>
    </div>
  </div>
</template>
