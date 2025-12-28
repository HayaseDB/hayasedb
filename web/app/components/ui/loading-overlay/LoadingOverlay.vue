<script setup lang="ts">
  const props = defineProps<{ isLoading: boolean }>()

  const TOTAL_LOGOS = 41
  const randomLogo = ref(1)

  watch(
    () => props.isLoading,
    (loading) => {
      if (loading) {
        randomLogo.value = Math.floor(Math.random() * TOTAL_LOGOS) + 1
      }
    },
  )
</script>

<template>
  <Transition name="fade">
    <div v-if="isLoading" class="loading-overlay">
      <img :src="`/loading/${randomLogo}.png`" alt="Loading" class="loading-image" />
    </div>
  </Transition>
</template>

<style scoped>
  @reference "~/assets/css/main.css";

  .loading-overlay {
    @apply fixed inset-0 z-50 flex items-center justify-center;
    backdrop-filter: blur(16px);
    background: oklch(0.145 0 0 / 0.8);
  }

  .loading-image {
    @apply h-24 w-auto animate-pulse object-contain;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
