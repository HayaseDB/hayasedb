<script setup lang="ts">
import type { AnimeFormat } from '@hayasedb/domain'

const props = withDefaults(
  defineProps<{
    title?: string
    cover?: string | null
    genres?: string[]
    format?: AnimeFormat | null
    year?: number | null
  }>(),
  {
    title: 'HayaseDB',
    cover: null,
    genres: () => [],
    format: null,
    year: null,
  },
)

const meta = computed(() =>
  [
    animeFormatLabel(props.format),
    props.year ? String(props.year) : null,
  ].filter((value): value is string => !!value),
)

const titleClass = computed(() => {
  const length = props.title?.length ?? 0
  if (length > 70) return 'text-5xl'
  if (length > 40) return 'text-6xl'
  return 'text-7xl'
})
</script>

<template>
  <div
    class="flex h-full w-full bg-black"
    style="font-family: Poppins, sans-serif"
  >
    <img
      v-if="cover"
      :src="cover"
      width="420"
      height="630"
      style="object-fit: cover"
    />

    <div class="flex flex-1 flex-col justify-between p-16">
      <div class="flex items-center">
        <AppLogo
          background="#ffffff"
          foreground="#000000"
          width="56"
          height="56"
        />
        <span class="ml-4 text-3xl font-semibold text-neutral-400">
          HayaseDB
        </span>
      </div>

      <div class="flex flex-col">
        <span class="leading-tight font-bold text-white" :class="titleClass">
          {{ title }}
        </span>

        <div v-if="meta.length" class="mt-6 flex text-3xl text-neutral-400">
          <span>{{ meta.join('  ·  ') }}</span>
        </div>

        <div v-if="genres.length" class="mt-8 flex">
          <div
            v-for="genre in genres"
            :key="genre"
            class="mr-4 flex rounded-full bg-violet-500 px-6 py-2 text-2xl text-white"
          >
            {{ genre }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
