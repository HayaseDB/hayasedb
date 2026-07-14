<script setup lang="ts">
withDefaults(
  defineProps<{
    src?: string | null
    alt?: string
    lazy?: boolean
    icon?: string
  }>(),
  { src: null, alt: '', lazy: false, icon: 'i-lucide-image-off' },
)
</script>

<template>
  <div class="bg-elevated relative size-full overflow-hidden">
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :loading="lazy ? 'lazy' : undefined"
      class="size-full object-cover"
    />
    <div v-else class="text-muted flex size-full items-center justify-center">
      <UIcon :name="icon" class="size-6" />
    </div>
  </div>
</template>
