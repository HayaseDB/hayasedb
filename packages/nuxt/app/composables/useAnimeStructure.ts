import {
  emptyAnimeStructure,
  fetchAnimeStructure,
  type EpisodeCollection,
} from '../utils/animeStructure'

export async function useAnimeStructure(animeId: Ref<string>) {
  const api = useApiClient()

  const structureData = useAsyncData(
    () => `anime-structure-${animeId.value}`,
    () => fetchAnimeStructure(api, animeId.value),
    { watch: [animeId], default: emptyAnimeStructure },
  )

  const { data } = await structureData
  const { status, error, refresh } = structureData

  const structure = computed(() => data.value ?? emptyAnimeStructure())
  const seasons = computed(() => structure.value.seasons.items)
  const episodes = computed(() => structure.value.episodes.items)
  const hasStructure = computed(
    () => seasons.value.length > 0 || episodes.value.length > 0,
  )
  const pending = computed(() => status.value === 'pending')

  function seasonEpisodes(seasonId: string): EpisodeCollection['items'] {
    return structure.value.episodesBySeason[seasonId]?.items ?? []
  }

  return {
    structure,
    seasons,
    episodes,
    seasonEpisodes,
    hasStructure,
    pending,
    error,
    refresh,
  }
}
