import {
  ANIME_FIELD_META,
  ANIME_FIELD_ORDER,
  canonicalizeRelation,
  isoToFuzzy,
  relationViewKind,
  type AnimeFieldKey,
  type AnimeRelationKind,
  type AnimeRelationViewKind,
  type FuzzyDate,
} from '@hayasedb/domain'
import type {
  AnimeDetail,
  AnimeFormat,
  AnimeStatus,
  AnimeTranslation,
} from '@hayasedb/contract'

export interface AnimeRelationSearchResult {
  id: string
  slug: string
  title: { title: string }
  startDate: FuzzyDate | null
}

export interface AnimeRelationEdgeItem {
  animeId: string
  title: string
  kind: AnimeRelationViewKind
}

export interface AnimeFormState {
  slug: string
  format: AnimeFormat | null
  status: AnimeStatus | null
  translations: AnimeTranslation[]
  startDate: FuzzyDate | null
  endDate: FuzzyDate | null
  genreIds: string[]
  relationEdges: AnimeRelationEdgeItem[]
}

type AnimeFormSource = Pick<
  AnimeDetail,
  | Exclude<keyof AnimeFormState, 'genreIds' | 'relationEdges'>
  | 'genres'
  | 'relations'
>

type ScalarFormField = Exclude<AnimeFieldKey, 'media' | 'relations'>

const FORM_FIELDS = ANIME_FIELD_ORDER.filter(
  (field): field is ScalarFormField =>
    field !== 'media' && field !== 'relations',
)

function emptyValue(field: ScalarFormField): unknown {
  const { empty } = ANIME_FIELD_META[field]
  return empty === 'emptyArray' ? [] : empty
}

export type AnimeTranslationField = 'title' | 'description'

export function isTranslationFieldChanged(
  translations: readonly AnimeTranslation[],
  baseline: readonly AnimeTranslation[] | undefined,
  index: number,
  field: AnimeTranslationField,
): boolean {
  const current = translations[index]
  if (!current || !baseline) return false
  const before = baseline.find((item) => item.locale === current.locale)
  if (!before) return true
  return (current[field] ?? '') !== (before[field] ?? '')
}

export function isTranslationSetChanged(
  translations: readonly AnimeTranslation[],
  baseline: readonly AnimeTranslation[] | undefined,
): boolean {
  if (!baseline) return false
  const locales = translations.map((item) => item.locale)
  const beforeLocales = baseline.map((item) => item.locale)
  if (locales.length !== beforeLocales.length) return true
  if ([...locales].sort().join() !== [...beforeLocales].sort().join())
    return true
  return translations.some((item) => {
    const before = baseline.find((entry) => entry.locale === item.locale)
    return before ? Boolean(item.original) !== Boolean(before.original) : false
  })
}

export function relationEdgeKey(edge: AnimeRelationEdgeItem): string {
  return `${edge.animeId}:${edge.kind}`
}

export function buildAnimeFormState(
  anime?: AnimeFormSource | null,
): AnimeFormState {
  const state: Record<string, unknown> = {}

  for (const field of FORM_FIELDS) {
    state[field] = emptyValue(field)
  }
  state.relationEdges = []

  if (anime) {
    for (const field of FORM_FIELDS) {
      if (field === 'genreIds') {
        state.genreIds = anime.genres.map((genre) => genre.id)
        continue
      }
      const value = (anime as unknown as Record<string, unknown>)[field]
      state[field] = value == null ? emptyValue(field) : structuredClone(value)
    }
    state.relationEdges = anime.relations.map(
      (relation): AnimeRelationEdgeItem => ({
        animeId: relation.anime.id,
        title: relation.anime.title.title,
        kind: relation.kind,
      }),
    )
  } else {
    state.translations = [
      {
        locale: 'en',
        title: '',
        description: null,
        original: true,
      },
    ]
  }

  return state as unknown as AnimeFormState
}

function isFuzzyDate(value: unknown): value is FuzzyDate {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as FuzzyDate).year === 'number'
  )
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function applyPayloadToState(
  target: AnimeFormState,
  payload: Record<string, unknown>,
): void {
  const state = target as unknown as Record<string, unknown>

  for (const field of FORM_FIELDS) {
    if (!(field in payload)) continue
    const value = payload[field]
    const { as, empty } = ANIME_FIELD_META[field]

    if (as === 'localized') {
      state[field] = Array.isArray(value)
        ? value.map((item) => ({ ...(item as object) }))
        : []
    } else if (empty === 'emptyArray') {
      state[field] = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : []
    } else if (empty === '') {
      state[field] = typeof value === 'string' ? value : ''
    } else if (as === 'fuzzydate') {
      state[field] = isFuzzyDate(value)
        ? value
        : typeof value === 'string' && ISO_DATE.test(value)
          ? isoToFuzzy(value)
          : null
    } else {
      state[field] = value ?? null
    }
  }
}

export interface PayloadRelationEdge {
  targetId: string
  kind: AnimeRelationKind
}

export function isPayloadRelationList(
  value: unknown,
): value is PayloadRelationEdge[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as PayloadRelationEdge).targetId === 'string' &&
        typeof (item as PayloadRelationEdge).kind === 'string',
    )
  )
}

export function applyRelationPayloadToState(
  target: AnimeFormState,
  ownerId: string,
  selfId: string,
  relations: PayloadRelationEdge[],
  labelOf: (animeId: string) => string | undefined,
): void {
  const viewerIsSource = ownerId === selfId
  const kept = target.relationEdges.filter(
    (edge) =>
      canonicalizeRelation(selfId, edge.animeId, edge.kind).sourceId !==
      ownerId,
  )
  const fromOwner = relations
    .filter((edge) => viewerIsSource || edge.targetId === selfId)
    .map((edge): AnimeRelationEdgeItem => {
      const animeId = viewerIsSource ? edge.targetId : ownerId
      return {
        animeId,
        title: labelOf(animeId) ?? '',
        kind: relationViewKind(edge.kind, viewerIsSource),
      }
    })
  target.relationEdges = [...kept, ...fromOwner]
}
