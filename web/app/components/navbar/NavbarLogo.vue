<script setup lang="ts">
  defineProps<{
    showText?: boolean
  }>()
</script>

<template>
  <NuxtLink to="/" class="flex items-center gap-2">
    <img src="~/assets/svg/icon-rounded.svg" alt="HayaseDB" class="size-8 shrink-0" />
    <span v-if="showText !== false" class="text-xl font-bold tracking-tight"> HayaseDB </span>
  </NuxtLink>
</template>
