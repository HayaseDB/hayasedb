<script setup lang="ts">
import {
  changesetSummarySchema,
  MAX_CHANGES_PER_CHANGESET,
  type AnimeDocumentMedia,
  type CreateAnimeInput,
  type Genre,
} from '@hayasedb/contract'
import type { ApiClient, ProposedGenre } from '#imports'

type AnimeDetail = Awaited<ReturnType<ApiClient['anime']['get']>>
type ChangesetDetail = Awaited<ReturnType<ApiClient['changeset']['get']>>

const props = withDefaults(
  defineProps<{
    anime: AnimeDetail | null
    genres: Genre[]
    prefill?: ChangesetDetail | null
  }>(),
  { prefill: null },
)

const router = useRouter()
const api = useApiClient()
const actions = useContributionActions()

const summaryMaxLength = changesetSummarySchema.maxLength ?? undefined

const prefillAnimeChange = computed(
  () =>
    props.prefill?.changes.find((change) => change.entityKind === 'anime') ??
    null,
)

const prefillPayload = computed(
  () =>
    (prefillAnimeChange.value?.payload ?? null) as Record<
      string,
      unknown
    > | null,
)

function prefillProposedGenres(): ProposedGenre[] {
  return (props.prefill?.changes ?? [])
    .filter((change) => change.entityKind === 'genre' && change.op === 'create')
    .map((change) => ({
      id: change.entityId,
      name: String((change.payload as Record<string, unknown>).name ?? ''),
    }))
    .filter((genre) => genre.name.length > 0)
}

const prefillSelfId = computed(
  () => props.anime?.id ?? prefillAnimeChange.value?.entityId ?? null,
)

function prefillRelations(next: AnimeFormState) {
  const selfId = prefillSelfId.value
  if (!props.prefill || !selfId) return
  const labelOf = (animeId: string) =>
    props.prefill?.display.refs.anime?.[animeId]
  for (const change of props.prefill.changes) {
    if (change.entityKind !== 'anime') continue
    const relations = (change.payload as Record<string, unknown>).relations
    if (!isPayloadRelationList(relations)) continue
    applyRelationPayloadToState(
      next,
      change.entityId,
      selfId,
      relations,
      labelOf,
    )
  }
}

const baseline = () => buildAnimeFormState(props.anime)

function initialState(): AnimeFormState {
  const next = baseline()
  if (prefillPayload.value) applyPayloadToState(next, prefillPayload.value)
  prefillRelations(next)
  return next
}

async function searchAnime(q: string) {
  const { items } = await api.anime.list({ q, limit: 10 })
  return items
}

const proposedGenres = ref<ProposedGenre[]>(prefillProposedGenres())

const mediaPrefill = computed(() => {
  const payload = prefillPayload.value
  if (!payload || !Array.isArray(payload.media) || !props.prefill) return null
  return {
    media: payload.media as AnimeDocumentMedia[],
    display: props.prefill.display,
  }
})

const media = useContributionMedia(() => props.anime, mediaPrefill)

const prefillStructureChanges = computed(() =>
  props.prefill?.changes.filter(
    (change) =>
      change.entityKind === 'animeSeason' ||
      change.entityKind === 'animeEpisode',
  ),
)

const session = useAnimeFormSession({
  anime: () => props.anime,
  media,
  initial: initialState,
  structurePrefill: prefillStructureChanges,
})

const { state, changes, changedFields, isDirty, relationRows, structure } =
  session

function proposeGenre(name: string) {
  const id = crypto.randomUUID()
  proposedGenres.value = [...proposedGenres.value, { id, name }]
  state.genreIds = [...state.genreIds, id]
}

const summary = ref(props.prefill?.summary ?? '')

watch([() => props.anime, () => props.prefill], () => {
  session.reset()
  proposedGenres.value = prefillProposedGenres()
  summary.value = props.prefill?.summary ?? ''
})

async function submit(data: CreateAnimeInput) {
  const changesetId = await actions.submit(
    props.anime ? { id: props.anime.id, headRev: props.anime.headRev } : null,
    {
      data,
      changedFields: changedFields.value,
      relations: {
        edges: state.relationEdges,
        baseline: session.relationBaseline.value,
      },
      mediaDirty: media.isDirty.value,
      summary: summary.value,
      buildDocumentMedia: (upload) => media.buildDocumentMedia(upload),
      newGenres: proposedGenres.value,
      supersedesId: props.prefill?.id,
      planStructure: (animeId) => structure.planFor(animeId),
    },
  )
  if (changesetId) await router.push(`/contributions/${changesetId}`)
  return Boolean(changesetId)
}
</script>

<template>
  <AnimeForm
    v-model:state="state"
    v-model:structure="structure.state.value"
    :media="media"
    :genres="genres"
    :proposed-genres="proposedGenres"
    :on-create-genre="proposeGenre"
    :is-edit="anime !== null"
    :is-dirty="isDirty"
    :changes="changes"
    :relation-rows="relationRows"
    :saving="actions.saving.value"
    submit-label="Submit for review"
    :self-id="anime?.id ?? null"
    :on-submit="submit"
    :on-search-anime="searchAnime"
    :structure-loading="structure.loading.value"
    :structure-change-count="structure.changes.value.length"
    :structure-change-budget="MAX_CHANGES_PER_CHANGESET"
  >
    <template #footer-leading>
      <UInput
        v-model="summary"
        placeholder="Describe your change (required)…"
        aria-label="Change summary"
        icon="i-lucide-message-square-text"
        class="w-full flex-1 sm:max-w-md"
        :maxlength="summaryMaxLength"
      />
    </template>
  </AnimeForm>
</template>
