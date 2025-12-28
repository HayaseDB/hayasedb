<script setup lang="ts">
  interface Props {
    title: string
    image: string
  }

  defineProps<Props>()
</script>

<template>
  <div class="overflow-hidden rounded-lg bg-zinc-800 shadow-lg">
    <img :src="image" :alt="title" class="aspect-2/3 w-full object-cover" loading="lazy" />
  </div>
</template>
