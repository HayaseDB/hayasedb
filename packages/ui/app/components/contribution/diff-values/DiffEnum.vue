<script setup lang="ts">
import type { EntityKind } from '@hayasedb/domain'

const props = defineProps<{
  entityKind: EntityKind
  field: string
  value: unknown
}>()

const text = computed(() =>
  contributionEnumLabel(props.entityKind, props.field, props.value),
)
</script>

<template>
  <span class="wrap-break-word">{{ text }}</span>
</template>
