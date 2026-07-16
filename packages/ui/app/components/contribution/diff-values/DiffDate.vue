<script setup lang="ts">
const props = defineProps<{ value: unknown }>()

const text = computed(
  () => formatAnimeDate(String(props.value)) ?? String(props.value),
)
</script>

<template>
  <span class="wrap-break-word">{{ text }}</span>
</template>
