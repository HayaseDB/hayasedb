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
    :class="props.class"
    :data-change="kind"
    :data-path="path"
  >
    <template v-if="CHANGE_LABEL[kind] || hint" #hint>
      <UBadge
        v-if="CHANGE_LABEL[kind]"
        :label="CHANGE_LABEL[kind]"
        :color="CHANGE_FIELD_COLOR[kind]"
        variant="subtle"
        size="sm"
      />
      <span v-else class="text-muted text-xs">{{ hint }}</span>
    </template>

    <slot :field="field" :kind="kind" />
  </UFormField>
</template>
