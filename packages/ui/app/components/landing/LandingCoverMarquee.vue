<script setup lang="ts">
import { Motion, useReducedMotion } from 'motion-v'
import type { AnimeListItem } from '@hayasedb/contract'

const props = defineProps<{
  items: Pick<AnimeListItem, 'id' | 'slug' | 'coverUrl' | 'titleEnglish'>[]
}>()

const reducedMotion = useReducedMotion()

const rows = computed(() => {
  const mid = Math.ceil(props.items.length / 2)
  return [props.items.slice(0, mid), props.items.slice(mid)].filter(
    (row) => row.length > 0,
  )
})

function rowIntro(index: number) {
  if (reducedMotion.value) return { initial: false as const }
  return {
    initial: { opacity: 0, y: 32, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: 0.45 + index * 0.15,
    },
  }
}
</script>

<template>
  <div aria-hidden="true" class="flex w-full flex-col gap-4">
    <Motion v-for="(row, index) in rows" :key="index" v-bind="rowIntro(index)">
      <UMarquee
        pause-on-hover
        :reverse="index === 1"
        class="[--duration:80s] [--gap:--spacing(4)]"
        :ui="{ content: 'motion-reduce:animate-none' }"
      >
        <NuxtLink
          v-for="anime in row"
          :key="anime.id"
          :to="`/anime/${anime.slug}`"
          tabindex="-1"
          class="aspect-[2/3] w-28 shrink-0 overflow-hidden rounded-lg sm:w-32"
        >
          <AnimeCoverImage
            :src="anime.coverUrl"
            :alt="anime.titleEnglish ?? undefined"
            lazy
          />
        </NuxtLink>
      </UMarquee>
    </Motion>
  </div>
</template>
