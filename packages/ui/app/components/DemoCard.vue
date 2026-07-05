<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold">{{ title }}</h2>
    </template>
    <slot />
  </UCard>
</template>
