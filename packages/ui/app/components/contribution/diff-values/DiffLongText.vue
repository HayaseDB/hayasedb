<script setup lang="ts">
const props = defineProps<{ value: unknown }>()

const text = computed(() => String(props.value))

const expanded = ref(false)
const textEl = useTemplateRef<HTMLElement>('textEl')
const clamped = useClampOverflow(textEl, expanded)

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <span class="flex flex-col items-start gap-1">
    <span
      ref="textEl"
      class="wrap-break-word whitespace-pre-line"
      :class="!expanded && 'line-clamp-6'"
    >
      {{ text }}
    </span>
    <UButton
      v-if="clamped"
      :label="expanded ? 'Show less' : 'Show more'"
      variant="link"
      color="neutral"
      size="xs"
      class="-ml-1 p-0"
      @click.stop="toggle()"
    />
  </span>
</template>
