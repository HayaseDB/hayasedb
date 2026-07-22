<script setup lang="ts">
import {
  changesetSummarySchema,
  type AnimeDocumentMedia,
  type CreateAnimeInput,
  type Genre,
} from '@hayasedb/contract'
import type { ApiClient, ProposedGenre } from '#imports'

type AnimeDetail = Awaited<ReturnType<ApiClient['anime']['getBySlug']>>
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

function baseline(): AnimeFormState {
  const next = buildAnimeFormState(props.anime)
  if (prefillPayload.value) applyPayloadToState(next, prefillPayload.value)
  return next
}

const state = reactive(baseline())
const proposedGenres = ref<ProposedGenre[]>(prefillProposedGenres())

function proposeGenre(name: string) {
  const id = crypto.randomUUID()
  proposedGenres.value = [...proposedGenres.value, { id, name }]
  state.genreIds = [...state.genreIds, id]
}

const {
  changedFields,
  isDirty: isFieldsDirty,
  reset,
} = useDirtyState(state, baseline)

const mediaPrefill = computed(() => {
  const payload = prefillPayload.value
  if (!payload || !Array.isArray(payload.media) || !props.prefill) return null
  return {
    media: payload.media as AnimeDocumentMedia[],
    display: props.prefill.display,
  }
})

const media = useContributionMedia(() => props.anime, mediaPrefill)
const isDirty = computed(() => isFieldsDirty.value || media.isDirty.value)

const summary = ref(props.prefill?.summary ?? '')

watch([() => props.anime, () => props.prefill], () => {
  reset()
  media.sync()
  proposedGenres.value = prefillProposedGenres()
  summary.value = props.prefill?.summary ?? ''
})

async function submit(data: CreateAnimeInput) {
  const changesetId = await actions.submit(
    props.anime ? { id: props.anime.id, headRev: props.anime.headRev } : null,
    {
      data,
      changedFields: changedFields.value,
      mediaDirty: media.isDirty.value,
      summary: summary.value,
      buildDocumentMedia: (upload) => media.buildDocumentMedia(upload),
      newGenres: proposedGenres.value,
      supersedesId: props.prefill?.id,
    },
  )
  if (changesetId) await router.push(`/contributions/${changesetId}`)
  return Boolean(changesetId)
}
</script>

<template>
  <AnimeForm
    v-model:state="state"
    :media="media"
    :genres="genres"
    :proposed-genres="proposedGenres"
    :on-create-genre="proposeGenre"
    :is-edit="anime !== null"
    :is-dirty="isDirty"
    :changed-fields="changedFields"
    :saving="actions.saving.value"
    submit-label="Submit for review"
    :on-submit="submit"
  >
    <template #footer-leading>
      <UInput
        v-model="summary"
        placeholder="Describe your change (required)…"
        icon="i-lucide-message-square-text"
        class="max-w-md flex-1"
        :maxlength="summaryMaxLength"
      />
    </template>
  </AnimeForm>
</template>
