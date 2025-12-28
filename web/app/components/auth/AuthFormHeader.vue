<script setup lang="ts">
  interface Props {
    title: string
    description: string
  }

  defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center gap-1 text-center">
    <h1 class="text-2xl font-bold">
      {{ title }}
    </h1>
    <p class="text-muted-foreground text-sm text-balance">
      {{ description }}
    </p>
  </div>
</template>
