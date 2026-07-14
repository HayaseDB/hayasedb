<script setup lang="ts" generic="T extends SelectValue">
import type { SelectValue } from '@nuxt/ui'

const model = defineModel<T>()

const props = defineProps<{
  clearValue?: T
}>()

const hasValue = computed(
  () => model.value !== undefined && model.value !== null && model.value !== '',
)

function clear() {
  model.value = props.clearValue
}
</script>

<template>
  <USelect v-model="model">
    <template #trailing>
      <UButton
        v-if="hasValue"
        icon="i-lucide-x"
        color="neutral"
        variant="link"
        size="xs"
        aria-label="Clear selection"
        class="p-0"
        @pointerdown.stop.prevent
        @click.stop.prevent="clear"
      />
      <UIcon
        v-else
        name="i-lucide-chevron-down"
        class="text-dimmed size-5 shrink-0"
      />
    </template>
  </USelect>
</template>
