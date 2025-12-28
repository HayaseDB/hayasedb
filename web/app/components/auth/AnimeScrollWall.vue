<script setup lang="ts">
  import { computed } from 'vue'
  import { InfiniteScrollColumn } from '@/components/ui/infinite-scroll-column'
  import AnimeCard from './AnimeCard.vue'
  import { type AnimeCover, animeCovers, shuffleArray } from '@/data/animeCovers'

  const columns = computed(() => {
    const numColumns = 4
    const cols: AnimeCover[][] = Array.from({ length: numColumns }, () => [])
    const shuffled = shuffleArray(animeCovers)

    for (const [index, cover] of shuffled.entries()) {
      cols[index % numColumns]!.push(cover)
    }

    return cols
  })
</script>

<template>
  <div
    class="absolute inset-0 grid grid-cols-4 gap-4 overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] px-4 opacity-40"
  >
    <InfiniteScrollColumn
      v-for="(columnCovers, index) in columns"
      :key="index"
      :duration="40 + index * 15"
      :direction="index % 2 === 0 ? 'up' : 'down'"
      class="h-full w-full"
    >
      <AnimeCard
        v-for="cover in columnCovers"
        :key="cover.id"
        :title="cover.title"
        :image="cover.image"
      />
    </InfiniteScrollColumn>
  </div>
</template>
