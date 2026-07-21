<script setup lang="ts">
const props = defineProps<{ value: unknown }>()

const CLAMP_THRESHOLD = 320

const text = computed(() => String(props.value))
const clampable = computed(
  () =>
    text.value.length > CLAMP_THRESHOLD || text.value.split('\n').length > 6,
)

const expanded = ref(false)

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <span class="flex flex-col items-start gap-1">
    <span
      class="wrap-break-word whitespace-pre-line"
      :class="clampable && !expanded && 'line-clamp-6'"
    >
      {{ text }}
    </span>
    <UButton
      v-if="clampable"
      :label="expanded ? 'Show less' : 'Show more'"
      variant="link"
      color="neutral"
      size="xs"
      class="-ml-1 p-0"
      @click.stop="toggle()"
    />
  </span>
</template>
