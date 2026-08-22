<script setup lang="ts">
import type { EntityKind, FieldMeta } from '@hayasedb/domain'

const props = defineProps<{
  entityKind: EntityKind
  field: string
  value: unknown
  meta?: FieldMeta
}>()

const resolved = computed(
  () => props.meta ?? contributionFieldMeta(props.entityKind, props.field),
)

const isEmpty = computed(() => {
  const value = props.value
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0)
  )
})
</script>

<template>
  <span v-if="isEmpty" class="text-muted">—</span>

  <DiffEnum
    v-else-if="resolved?.as === 'enum'"
    :entity-kind="entityKind"
    :field="field"
    :value="value"
  />
  <DiffDate v-else-if="resolved?.as === 'fuzzydate'" :value="value" />
  <DiffRefBadges
    v-else-if="resolved?.as === 'ref' && resolved.ref"
    :target="resolved.ref"
    :ref-path="resolved.refPath === 'self' ? undefined : resolved.refPath"
    :value="value"
  />
  <DiffMedia v-else-if="resolved?.as === 'media'" :value="value" />
  <DiffLongText v-else-if="resolved?.as === 'longtext'" :value="value" />

  <DiffText v-else :value="value" />
</template>
