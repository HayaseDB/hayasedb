<script setup lang="ts">
import type { RefTarget } from '@hayasedb/domain'

const props = defineProps<{
  target: RefTarget
  value: unknown
  refPath?: string
}>()

const display = useContributionDisplay()

interface RefItem {
  id: string
  prefix?: string
}

const items = computed<RefItem[]>(() => {
  if (!Array.isArray(props.value)) return []
  return props.value.flatMap((entry: unknown): RefItem[] => {
    if (typeof entry === 'string') return [{ id: entry }]
    if (!entry || typeof entry !== 'object' || !props.refPath) return []
    const record = entry as Record<string, unknown>
    const id = record[props.refPath]
    if (typeof id !== 'string') return []
    const kind = record.kind
    return [
      {
        id,
        prefix:
          typeof kind === 'string'
            ? contributionEnumLabel('anime', 'kind', kind)
            : undefined,
      },
    ]
  })
})

const labels = computed(() =>
  items.value.map((item) => ({
    key: `${item.prefix ?? ''}:${item.id}`,
    label: `${item.prefix ? `${item.prefix}: ` : ''}${
      display.value.refs[props.target]?.[item.id] ?? 'Unknown'
    }`,
  })),
)
</script>

<template>
  <span class="flex flex-wrap gap-1">
    <UBadge
      v-for="item in labels"
      :key="item.key"
      :label="item.label"
      color="neutral"
      variant="subtle"
      size="sm"
    />
  </span>
</template>
