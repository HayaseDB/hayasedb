<script setup lang="ts">
import type { AnimeEpisodeItem, AnimeSeasonItem } from '#imports'

const props = defineProps<{
  seasons: AnimeSeasonItem[]
  episodes: AnimeEpisodeItem[]
  seasonEpisodes: (seasonId: string) => AnimeEpisodeItem[]
  loading?: boolean
}>()

const hasSeasons = computed(() => props.seasons.length > 0)
const hasEpisodes = computed(() => props.episodes.length > 0)

const open = ref<string[]>([])
watch(
  () => props.seasons,
  (seasons) => {
    const first = seasons[0]
    if (first && open.value.length === 0) open.value = [first.id]
  },
  { immediate: true },
)

const seasonLabel = (season: AnimeSeasonItem) => {
  const kind = ANIME_SEASON_KIND_LABELS[season.kind]
  const named = season.title?.title
  if (named) return named
  return season.number ? `${kind} ${season.number}` : kind
}

const seasonMeta = (season: AnimeSeasonItem) => {
  const parts: string[] = [
    `${season.episodeCount} ${season.episodeCount === 1 ? 'episode' : 'episodes'}`,
  ]
  const year = season.firstAirDate?.slice(0, 4)
  const endYear = season.lastAirDate?.slice(0, 4)
  if (year)
    parts.push(year === endYear || !endYear ? year : `${year}–${endYear}`)
  return parts.join(' · ')
}
</script>

<template>
  <section>
    <h2 class="text-highlighted mb-4 text-lg font-semibold">Episodes</h2>

    <div v-if="loading" class="flex flex-col gap-3">
      <USkeleton v-for="index in 3" :key="index" class="h-14 w-full" />
    </div>

    <UAccordion
      v-else-if="hasSeasons"
      v-model="open"
      type="multiple"
      :items="seasons.map((season) => ({ value: season.id, season }))"
      :ui="{ trigger: 'gap-3' }"
    >
      <template #default="{ item }">
        <div class="flex min-w-0 flex-1 flex-col items-start text-left">
          <span class="text-highlighted text-sm font-medium">
            {{ seasonLabel(item.season) }}
          </span>
          <span class="text-muted text-xs">{{ seasonMeta(item.season) }}</span>
        </div>
      </template>

      <template #content="{ item }">
        <ul
          v-if="seasonEpisodes(item.season.id).length"
          class="grid grid-cols-[auto_minmax(0,1fr)] pb-2"
        >
          <AnimeEpisodeRow
            v-for="episode in seasonEpisodes(item.season.id)"
            :key="episode.id"
            :episode="episode"
          />
        </ul>

        <p v-else class="text-muted py-3 text-sm">
          No episodes listed for this
          {{ ANIME_SEASON_KIND_LABELS[item.season.kind].toLowerCase() }} yet.
        </p>
      </template>
    </UAccordion>

    <div v-if="!loading && hasEpisodes" :class="hasSeasons && 'mt-6'">
      <ul class="grid grid-cols-[auto_minmax(0,1fr)]">
        <AnimeEpisodeRow
          v-for="episode in episodes"
          :key="episode.id"
          :episode="episode"
        />
      </ul>
    </div>

    <p
      v-if="!loading && !hasSeasons && !hasEpisodes"
      class="text-muted text-sm"
    >
      No episodes listed yet.
    </p>
  </section>
</template>
