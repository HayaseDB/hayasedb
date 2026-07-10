<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))
</script>

<template>
  <UContainer class="py-10">
    <UButton
      to="/explore"
      variant="link"
      color="neutral"
      icon="i-lucide-arrow-left"
      class="mb-4 -ml-2"
    >
      Back to explore
    </UButton>

    <div class="flex flex-col gap-1">
      <h1 class="text-highlighted text-2xl font-semibold">{{ slug }}</h1>
      <p class="text-muted text-sm">Anime details coming soon.</p>
    </div>
  </UContainer>
</template>
