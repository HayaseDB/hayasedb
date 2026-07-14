<script setup lang="ts">
import type { AnimeFormat, AnimeStatus } from '@hayasedb/domain'

const props = defineProps<{
  genres: { id: string; name: string }[]
}>()

const q = defineModel<string>('q', { default: '' })
const format = defineModel<AnimeFormat>('format')
const status = defineModel<AnimeStatus>('status')
const genreId = defineModel<string>('genreId')

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
      class="sm:max-w-xs"
    />
    <div class="flex flex-wrap gap-2">
      <AppSelect
        v-model="format"
        :items="animeFormatOptions"
        value-key="value"
        placeholder="All formats"
        class="w-40"
      />
      <AppSelect
        v-model="status"
        :items="animeStatusOptions"
        value-key="value"
        placeholder="All statuses"
        class="w-44"
      />
      <AppSelect
        v-model="genreId"
        :items="genreItems"
        value-key="value"
        placeholder="All genres"
        class="w-40"
      />
    </div>
    <slot name="trailing" />
  </div>
</template>
