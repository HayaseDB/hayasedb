<script setup lang="ts">
import type { EntityKind } from '@hayasedb/domain'

const props = defineProps<{
  entityKind: EntityKind
  document: Record<string, unknown>
}>()

const rows = computed(() => buildContextRows(props.entityKind, props.document))
</script>

<template>
  <div
    role="table"
    class="border-default divide-default divide-y rounded-lg border"
  >
    <div
      role="row"
      class="text-muted hidden items-center gap-4 px-4 py-2.5 text-xs font-medium md:grid md:grid-cols-[10rem_1fr]"
    >
      <span role="columnheader">Field</span>
      <span role="columnheader">Current value</span>
    </div>

    <div
      v-for="row in rows"
      :key="row.key"
      role="row"
      class="grid items-start gap-x-4 gap-y-2 px-2 py-3 text-sm md:grid-cols-[10rem_1fr]"
    >
      <span role="rowheader" class="text-muted px-2 text-sm md:pt-1">
        {{ row.label }}
      </span>
      <div role="cell" class="text-muted min-w-0 px-2 py-1">
        <ChangeDiffValue
          :entity-kind="entityKind"
          :field="row.key"
          :meta="row.meta"
          :value="row.value"
        />
      </div>
    </div>
  </div>
</template>
