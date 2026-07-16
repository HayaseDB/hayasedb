<script setup lang="ts">
defineProps<{ value: unknown }>()
</script>

<template>
  <span class="wrap-break-word whitespace-pre-line">{{ String(value) }}</span>
</template>
