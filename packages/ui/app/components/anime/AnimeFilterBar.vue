<script setup lang="ts">
import type { AnimeFormat, AnimeSortKey, AnimeStatus } from '@hayasedb/domain'

const props = defineProps<{
  genres: { id: string; name: string }[]
  showYear?: boolean
}>()

const q = defineModel<string>('q', { default: '' })
const format = defineModel<AnimeFormat>('format')
const status = defineModel<AnimeStatus>('status')
const genreId = defineModel<string>('genreId')
const year = defineModel<number>('year')
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
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
    <UInput
      v-model="q"
      icon="i-lucide-search"
      placeholder="Search anime…"
      aria-label="Search anime"
      class="w-full sm:w-64"
    />
    <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <AppSelect
        v-model="format"
        :items="animeFormatOptions"
        value-key="value"
        placeholder="All formats"
        aria-label="Format"
        class="w-full sm:w-40"
      />
      <AppSelect
        v-model="status"
        :items="animeStatusOptions"
        value-key="value"
        placeholder="All statuses"
        aria-label="Status"
        class="w-full sm:w-44"
      />
      <AppSelect
        v-model="genreId"
        :items="genreItems"
        value-key="value"
        placeholder="All genres"
        aria-label="Genre"
        class="w-full sm:w-40"
      />
      <AppSelect
        v-if="showYear"
        v-model="year"
        :items="yearItems"
        value-key="value"
        placeholder="All years"
        aria-label="Year"
        class="w-full sm:w-32"
      />
      <USelect
        v-if="sortKey !== undefined"
        v-model="sortKey"
        :items="animeSortOptions"
        value-key="value"
        icon="i-lucide-arrow-down-up"
        aria-label="Sort by"
        class="w-full sm:w-40"
      />
    </div>
    <slot name="trailing" />
  </div>
</template>
