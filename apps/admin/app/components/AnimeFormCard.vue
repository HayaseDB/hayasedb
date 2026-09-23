<script setup lang="ts">
import type { CreateAnimeInput, Genre } from '@hayasedb/contract'
import type { ApiClient } from '#imports'

type AnimeDetail = Awaited<ReturnType<ApiClient['anime']['get']>>

const props = defineProps<{
  anime: AnimeDetail | null
  genres: Genre[]
  onSaved?: () => unknown
}>()

const api = useApiClient()
const actions = useAnimeActions()

const media = useStagedMedia(() => props.anime, api.anime)

const session = useAnimeFormSession({
  anime: () => props.anime,
  media,
})

const { state, changes, changedFields, isDirty, relationRows, structure } =
  session

async function searchAnime(q: string) {
  const { items } = await api.anime.list({ q, limit: 10 })
  return items
}

async function submit(data: CreateAnimeInput) {
  const ok = await actions.save(props.anime, {
    data,
    changedFields: changedFields.value,
    relations: {
      edges: state.relationEdges,
      baseline: session.relationBaseline.value,
    },
    commitMedia: (animeId) => media.commit(animeId),
    commitStructure: (animeId) => structure.applyDirect(animeId),
  })
  if (ok) structure.commit()
  if (ok && props.anime) await props.onSaved?.()
  return ok
}
</script>

<template>
  <AnimeForm
    v-model:state="state"
    v-model:structure="structure.state.value"
    :media="media"
    :genres="genres"
    :is-edit="anime !== null"
    :is-dirty="isDirty"
    :changes="changes"
    :relation-rows="relationRows"
    :saving="actions.saving.value"
    :self-id="anime?.id ?? null"
    :on-submit="submit"
    :on-search-anime="searchAnime"
    :structure-loading="structure.loading.value"
  />
</template>
