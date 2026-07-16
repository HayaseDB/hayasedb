<script setup lang="ts">
import type { RefTarget } from '@hayasedb/domain'

const props = defineProps<{
  target: RefTarget
  value: unknown
}>()

const display = useContributionDisplay()

const ids = computed<string[]>(() =>
  Array.isArray(props.value)
    ? props.value.filter((id: unknown): id is string => typeof id === 'string')
    : [],
)

const labels = computed(() =>
  ids.value.map((id) => ({
    id,
    label: display.value.refs[props.target]?.[id] ?? 'Unknown',
  })),
)
</script>

<template>
  <span class="flex flex-wrap gap-1">
    <UBadge
      v-for="item in labels"
      :key="item.id"
      :label="item.label"
      color="neutral"
      variant="subtle"
      size="sm"
    />
  </span>
</template>
