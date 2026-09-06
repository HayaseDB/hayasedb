import { stableStringify } from '@hayasedb/domain'
import type { AnimeStructure } from '#imports'
import {
  applyStructurePrefill,
  buildStructureState,
  emptyStructureState,
  planStructureChanges,
  type AnimeStructureState,
  type EpisodeDraft,
  type SeasonDraft,
} from '../utils/animeStructureForm'

const titlesOf = <T extends { title: string }>(items: T[]) =>
  items.filter((item) => item.title.trim() !== '')

const sameOrder = (current: { id: string }[], desired: string[]) =>
  current.length === desired.length &&
  current.every((item, index) => item.id === desired[index])

export interface StructurePrefillChange {
  entityKind: string
  entityId: string
  op: string
  payload: Record<string, unknown>
}

export function useAnimeStructureDraft(
  animeId: Ref<string | null>,
  prefillChanges?: Ref<StructurePrefillChange[] | undefined>,
) {
  const api = useApiClient()

  const state = ref<AnimeStructureState>(emptyStructureState())
  const baseline = ref<AnimeStructureState>(emptyStructureState())
  const loading = ref(false)

  const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

  function seed(structure: AnimeStructure) {
    const next = buildStructureState(
      structure.seasons.items,
      Object.fromEntries(
        Object.entries(structure.episodesBySeason).map(([id, page]) => [
          id,
          page.items,
        ]),
      ),
      structure.episodes.items,
    )
    baseline.value = clone(next)
    if (prefillChanges?.value?.length) {
      applyStructurePrefill(next, prefillChanges.value)
    }
    state.value = next
  }

  async function load() {
    const id = animeId.value
    if (!id) {
      seed(emptyAnimeStructure())
      return
    }
    loading.value = true
    try {
      seed(await fetchAnimeStructure(api, id))
    } finally {
      loading.value = false
    }
  }

  watch([animeId, () => prefillChanges?.value], () => void load(), {
    immediate: true,
  })

  const changes = computed(() =>
    animeId.value
      ? planStructureChanges(animeId.value, state.value, baseline.value)
      : [],
  )

  const isDirty = computed(
    () => stableStringify(state.value) !== stableStringify(baseline.value),
  )

  function planFor(id: string) {
    return planStructureChanges(id, state.value, baseline.value)
  }

  async function applySeason(
    ownerAnimeId: string,
    season: SeasonDraft,
  ): Promise<string | null> {
    if (season.removed) {
      if (!season.isNew) await api.season.remove({ id: season.id })
      return null
    }

    const fields = {
      kind: season.kind,
      number: season.number,
      translations: titlesOf(season.translations),
    }

    if (season.isNew) {
      const created = await api.season.create({
        animeId: ownerAnimeId,
        ...fields,
      })
      season.id = created.id
      season.isNew = false
    } else {
      await api.season.update({ id: season.id, ...fields })
    }
    return season.id
  }

  async function applyEpisodes(
    episodes: EpisodeDraft[],
    owner: { seasonId: string } | { animeId: string },
  ): Promise<string[]> {
    const ids: string[] = []

    for (const episode of episodes) {
      if (episode.removed) {
        if (!episode.isNew) await api.episode.remove({ id: episode.id })
        continue
      }

      const fields = {
        number: episode.number,
        type: episode.type,
        status: episode.status,
        airDate: episode.airDate,
        durationSeconds: episode.durationSeconds,
        stillMediaId: episode.stillMediaId,
        translations: titlesOf(episode.translations),
      }

      if (episode.isNew) {
        const created =
          'seasonId' in owner
            ? await api.episode.createForSeason({
                seasonId: owner.seasonId,
                ...fields,
              })
            : await api.episode.createForAnime({
                animeId: owner.animeId,
                ...fields,
              })
        episode.id = created.id
        episode.isNew = false
      } else {
        await api.episode.update({ id: episode.id, ...fields })
      }

      ids.push(episode.id)
    }

    return ids
  }

  async function applyDirect(id: string) {
    const seasonIds: string[] = []

    for (const season of state.value.seasons) {
      const seasonId = await applySeason(id, season)
      if (!seasonId) continue
      seasonIds.push(seasonId)

      const episodeIds = await applyEpisodes(season.episodes, { seasonId })
      if (episodeIds.length > 1) {
        const current = await fetchSeasonEpisodes(api, seasonId)
        if (!sameOrder(current.items, episodeIds)) {
          await api.episode.reorderForSeason({
            seasonId,
            orderedIds: episodeIds,
            expectedOrderEtag: current.orderEtag,
          })
        }
      }
    }

    if (seasonIds.length > 1) {
      const current = await fetchSeasons(api, id)
      if (!sameOrder(current.items, seasonIds)) {
        await api.season.reorder({
          animeId: id,
          orderedIds: seasonIds,
          expectedOrderEtag: current.orderEtag,
        })
      }
    }

    const directIds = await applyEpisodes(state.value.episodes, { animeId: id })
    if (directIds.length > 1) {
      const current = await fetchAnimeEpisodes(api, id)
      if (!sameOrder(current.items, directIds)) {
        await api.episode.reorderForAnime({
          animeId: id,
          orderedIds: directIds,
          expectedOrderEtag: current.orderEtag,
        })
      }
    }
  }

  function commit() {
    state.value.seasons = state.value.seasons.filter(
      (season) => !season.removed,
    )
    for (const season of state.value.seasons) {
      season.episodes = season.episodes.filter((episode) => !episode.removed)
    }
    state.value.episodes = state.value.episodes.filter(
      (episode) => !episode.removed,
    )
    baseline.value = clone(state.value)
  }

  return {
    state,
    baseline,
    loading,
    changes,
    isDirty,
    planFor,
    applyDirect,
    commit,
    reload: load,
  }
}
