<script setup lang="ts" generic="T extends SelectValue">
import type { HTMLAttributes } from 'vue'
import type { SelectValue } from '@nuxt/ui'

defineOptions({ inheritAttrs: false })

const model = defineModel<T>()

const props = defineProps<{
  clearValue?: T
}>()

const attrs = useAttrs()
const rootClass = computed(() => attrs.class as HTMLAttributes['class'])
const selectAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const hasValue = computed(
  () => model.value !== undefined && model.value !== null && model.value !== '',
)

function clear() {
  model.value = props.clearValue
}
</script>

<template>
  <div class="relative" :class="rootClass">
    <USelect
      v-model="model"
      v-bind="selectAttrs"
      class="w-full"
      :ui="{ trailing: hasValue ? 'invisible' : undefined }"
    />
    <UButton
      v-if="hasValue"
      icon="i-lucide-x"
      color="neutral"
      variant="link"
      size="xs"
      aria-label="Clear selection"
      class="absolute inset-y-0 end-0 pe-2.5"
      @click="clear"
    />
  </div>
</template>
