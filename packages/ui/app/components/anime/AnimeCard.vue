<script setup lang="ts">
import type { AnimeListItem } from '@hayasedb/contract'

defineProps<{
  anime: Pick<
    AnimeListItem,
    | 'coverUrl'
    | 'format'
    | 'status'
    | 'slug'
    | 'titleRomaji'
    | 'titleEnglish'
    | 'titleNative'
  >
  to: string
}>()
</script>

<template>
  <NuxtLink :to="to" class="group flex flex-col gap-2">
    <AnimeCoverImage
      :src="anime.coverUrl"
      :alt="anime.slug"
      lazy
      class="aspect-[2/3] rounded-lg"
    />
    <div class="flex flex-col gap-1">
      <span
        class="text-highlighted group-hover:text-primary line-clamp-2 text-sm font-medium"
      >
        {{ anime.titleEnglish }}
      </span>
      <AnimeBadges :format="anime.format" :status="anime.status" />
    </div>
  </NuxtLink>
</template>
