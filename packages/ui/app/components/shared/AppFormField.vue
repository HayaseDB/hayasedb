<script setup lang="ts">
import type { ChangeKind } from '#imports'

const props = withDefaults(
  defineProps<{
    path: string
    label?: string
    name?: string
    required?: boolean
    description?: string
    hint?: string
    class?: string
  }>(),
  {
    label: undefined,
    name: undefined,
    required: false,
    description: undefined,
    hint: undefined,
    class: undefined,
  },
)

const scope = useChangeScope()

const kind = computed<ChangeKind>(() => scope.kindOf(props.path))

const field = computed(() => {
  const color = CHANGE_FIELD_COLOR[kind.value]
  return { highlight: color !== undefined, color }
})
</script>

<template>
  <UFormField
    :label="label"
    :name="name"
    :required="required"
    :description="description"
    :hint="hint"
    :class="props.class"
    :data-change="kind"
    :data-path="path"
  >
    <slot :field="field" :kind="kind" />
  </UFormField>
</template>
