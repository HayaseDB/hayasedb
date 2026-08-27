<script setup lang="ts">
import type { AnimeFormat, AnimeSortKey, AnimeStatus } from '@hayasedb/domain'

const props = defineProps<{
  genres: { id: string; name: string }[]
  showYear?: boolean
}>()

const q = defineModel<string>('q', { default: '' })
const format = defineModel<AnimeFormat>('format')
const status = defineModel<AnimeStatus>('status')
const genre = defineModel<string>('genre')
const yearMin = defineModel<number>('yearMin')
const yearMax = defineModel<number>('yearMax')
const sortKey = defineModel<AnimeSortKey>('sortKey')

const FIRST_ANIME_YEAR = 1907

const yearItems = computed(() => {
  const latestYear = new Date().getFullYear() + 1
  return Array.from({ length: latestYear - FIRST_ANIME_YEAR + 1 }, (_, i) => {
    const value = latestYear - i
    return { label: String(value), value }
  })
})

const genreItems = computed(() =>
  props.genres.map((g: { id: string; name: string }) => ({
    label: g.name,
    value: g.id,
  })),
)
</script>

<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
    <UInput
      v-model="q"
      icon="i-lucide-search"
      placeholder="Search anime…"
      aria-label="Search anime"
      class="w-full lg:w-64 lg:shrink-0"
    />

    <div
      class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center"
    >
      <AppSelect
        v-model="format"
        :items="animeFormatOptions"
        value-key="value"
        placeholder="All formats"
        aria-label="Format"
        class="w-full lg:w-40"
      />
      <AppSelect
        v-model="status"
        :items="animeStatusOptions"
        value-key="value"
        placeholder="All statuses"
        aria-label="Status"
        class="w-full lg:w-44"
      />
      <AppSelect
        v-model="genre"
        :items="genreItems"
        value-key="value"
        placeholder="All genres"
        aria-label="Genre"
        class="w-full lg:w-40"
      />
      <AppSelect
        v-if="showYear"
        v-model="yearMin"
        :items="yearItems"
        value-key="value"
        placeholder="Year from"
        aria-label="Earliest release year"
        class="w-full lg:w-32"
      />
      <AppSelect
        v-if="showYear"
        v-model="yearMax"
        :items="yearItems"
        value-key="value"
        placeholder="Year to"
        aria-label="Latest release year"
        class="w-full lg:w-32"
      />
      <USelect
        v-if="sortKey !== undefined"
        v-model="sortKey"
        :items="animeSortOptions"
        value-key="value"
        icon="i-lucide-arrow-down-up"
        aria-label="Sort by"
        class="col-span-full w-full sm:col-span-1 lg:w-40"
      />
    </div>

    <div class="flex items-center gap-2 lg:ms-auto lg:shrink-0">
      <slot name="trailing" />
    </div>
  </div>
</template>
