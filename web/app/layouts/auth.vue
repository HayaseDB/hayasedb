<script setup lang="ts">
  import AnimeScrollWall from '@/components/auth/AnimeScrollWall.vue'
</script>

<template>
  <div class="bg-background text-foreground grid min-h-svh lg:grid-cols-2">
    <div class="flex flex-col gap-4 p-6 md:p-10">
      <div class="flex justify-center gap-2 md:justify-start">
        <NuxtLink to="/" class="flex items-center gap-2 font-medium">
          <div
            class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
          >
            <Icon name="lucide:gallery-vertical-end" class="size-4" />
          </div>
          HayaseDB
        </NuxtLink>
      </div>
      <div class="flex flex-1 items-center justify-center">
        <div class="w-full max-w-xs">
          <slot />
        </div>
      </div>
    </div>
    <div class="relative hidden overflow-hidden bg-zinc-900 lg:block">
      <AnimeScrollWall />
    </div>
  </div>
</template>
