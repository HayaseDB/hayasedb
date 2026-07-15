<script setup lang="ts">
import type { CreateAnimeInput, Genre } from '@hayasedb/contract'
import type { ApiClient } from '#imports'

type AnimeDetail = Awaited<ReturnType<ApiClient['anime']['getById']>>

const props = defineProps<{
  anime: AnimeDetail | null
  genres: Genre[]
  onSaved?: () => unknown
}>()

const api = useApiClient()
const actions = useAnimeActions()

const state = reactive(buildAnimeFormState(props.anime))
const {
  changedFields,
  isDirty: isFieldsDirty,
  reset,
} = useDirtyState(state, () => buildAnimeFormState(props.anime))

const media = useStagedMedia(() => props.anime, api.anime)
const isDirty = computed(() => isFieldsDirty.value || media.isDirty.value)

watch(
  () => props.anime,
  () => {
    reset()
    media.sync()
  },
)

async function submit(data: CreateAnimeInput) {
  const ok = await actions.save(props.anime, {
    data,
    changedFields: changedFields.value,
    commitMedia: (animeId) => media.commit(animeId),
  })
  if (ok && props.anime) await props.onSaved?.()
  return ok
}
</script>

<template>
  <AnimeForm
    v-model:state="state"
    :media="media"
    :genres="genres"
    :is-edit="anime !== null"
    :is-dirty="isDirty"
    :changed-fields="changedFields"
    :saving="actions.saving.value"
    :on-submit="submit"
  />
</template>
