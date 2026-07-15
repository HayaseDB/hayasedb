<script setup lang="ts">
import type { AnimeListItem } from '@hayasedb/contract'

defineProps<{
  anime: Pick<AnimeListItem, 'coverUrl' | 'slug' | 'titleEnglish'>
  to: string
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="group focus-visible:ring-primary flex flex-col gap-2 rounded-lg focus-visible:ring-2 focus-visible:outline-none"
  >
    <div
      class="ring-default group-hover:ring-primary/50 aspect-[2/3] w-full overflow-hidden rounded-lg ring-1 transition"
    >
      <AnimeCoverImage
        :src="anime.coverUrl"
        :alt="anime.titleEnglish ?? undefined"
        lazy
        class="transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <span
      class="text-highlighted group-hover:text-primary line-clamp-2 text-sm leading-snug font-medium transition-colors"
    >
      {{ anime.titleEnglish }}
    </span>
  </NuxtLink>
</template>
