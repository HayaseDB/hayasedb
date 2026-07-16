<script setup lang="ts">
defineProps<{ value: unknown }>()
</script>

<template>
  <span class="line-clamp-6 wrap-break-word whitespace-pre-line">{{
    String(value)
  }}</span>
</template>
