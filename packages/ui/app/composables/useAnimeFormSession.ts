import { ANIME_FIELD_META } from '@hayasedb/domain'
import type { AnimeFormState, AnimeMediaController, ChangeSet } from '#imports'
import type { StructurePrefillChange } from './useAnimeStructureDraft'

export function useAnimeFormSession(options: {
  anime: () =>
    | (NonNullable<Parameters<typeof buildAnimeFormState>[0]> & { id: string })
    | null
  media: AnimeMediaController & { isDirty: Ref<boolean>; sync: () => void }
  initial?: () => AnimeFormState
  structurePrefill?: Ref<StructurePrefillChange[] | undefined>
  watchSources?: unknown[]
}) {
  const { anime, media } = options

  const baseline = computed(() => buildAnimeFormState(anime()))

  const createInitial = options.initial ?? (() => buildAnimeFormState(anime()))

  const state = reactive(createInitial()) as AnimeFormState

  const fields = useFieldChanges({
    state,
    baseline: () => baseline.value,
    meta: ANIME_FIELD_META,
    initial: createInitial,
    enabled: () => anime() !== null,
    expand: {
      translations: (next, base) => expandAnimeTranslationPaths(next, base),
    },
  })

  const structure = useAnimeStructureDraft(
    computed(() => anime()?.id ?? null),
    options.structurePrefill,
  )

  const relationBaseline = computed(() => baseline.value.relationEdges)

  const relationRows = computed(() =>
    buildRelationRows(state.relationEdges, relationBaseline.value),
  )

  const changes = computed<ChangeSet>(() => {
    const paths = new Set(fields.changes.value.paths)
    for (const path of structureChangePaths(
      structure.state.value,
      structure.baseline.value,
    )) {
      paths.add(path)
    }
    for (const path of media.changedPaths.value) paths.add(path)
    return {
      topLevel: fields.changes.value.topLevel,
      paths,
      isDirty: paths.size > 0,
    }
  })

  const isDirty = computed(
    () =>
      fields.isDirty.value || media.isDirty.value || structure.isDirty.value,
  )

  function reset() {
    fields.reset()
    media.sync()
    void structure.reload()
  }

  watch(() => anime(), reset)

  return {
    state,
    baseline,
    changes,
    changedFields: fields.changedFields,
    isDirty,
    relationBaseline,
    relationRows,
    structure,
    reset,
  }
}
