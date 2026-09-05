<script setup lang="ts">
import type { AnimeEpisode, AnimeSeason } from '@hayasedb/contract'

const props = defineProps<{
  seasons: AnimeSeason[]
  episodes: AnimeEpisode[]
  loadSeason: (seasonId: string) => Promise<AnimeEpisode[]>
  loading?: boolean
}>()

const hasSeasons = computed(() => props.seasons.length > 0)

const seasonEpisodes = ref<Record<string, AnimeEpisode[]>>({})
const loadingSeasons = ref<Set<string>>(new Set())
const failedSeasons = ref<Set<string>>(new Set())

async function ensureSeason(seasonId: string) {
  if (seasonEpisodes.value[seasonId] || loadingSeasons.value.has(seasonId))
    return
  loadingSeasons.value = new Set(loadingSeasons.value).add(seasonId)
  const failed = new Set(failedSeasons.value)
  failed.delete(seasonId)
  failedSeasons.value = failed
  try {
    seasonEpisodes.value = {
      ...seasonEpisodes.value,
      [seasonId]: await props.loadSeason(seasonId),
    }
  } catch {
    failedSeasons.value = new Set(failedSeasons.value).add(seasonId)
  } finally {
    const next = new Set(loadingSeasons.value)
    next.delete(seasonId)
    loadingSeasons.value = next
  }
}

const open = ref<string[]>([])
watch(
  () => props.seasons,
  (seasons) => {
    const first = seasons[0]
    if (first && open.value.length === 0) {
      open.value = [first.id]
      void ensureSeason(first.id)
    }
  },
  { immediate: true },
)

watch(open, (ids) => {
  for (const id of ids) void ensureSeason(id)
})

const seasonLabel = (season: AnimeSeason) => {
  const kind = ANIME_SEASON_KIND_LABELS[season.kind]
  const named = season.title?.title
  if (named) return named
  return season.number ? `${kind} ${season.number}` : kind
}

const seasonMeta = (season: AnimeSeason) => {
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
        <div
          v-if="loadingSeasons.has(item.season.id)"
          class="flex flex-col gap-2 pb-3"
        >
          <USkeleton v-for="index in 3" :key="index" class="h-12 w-full" />
        </div>

        <UAlert
          v-else-if="failedSeasons.has(item.season.id)"
          color="error"
          variant="subtle"
          title="Could not load episodes"
          :actions="[
            { label: 'Retry', onClick: () => ensureSeason(item.season.id) },
          ]"
          class="mb-3"
        />

        <ul v-else-if="seasonEpisodes[item.season.id]?.length" class="pb-2">
          <AnimeEpisodeRow
            v-for="episode in seasonEpisodes[item.season.id]"
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

    <ul v-else-if="episodes.length">
      <AnimeEpisodeRow
        v-for="episode in episodes"
        :key="episode.id"
        :episode="episode"
      />
    </ul>

    <p v-else class="text-muted text-sm">No episodes listed yet.</p>
  </section>
</template>
