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
import type { AnimeDetail, AnimeFormat, AnimeStatus } from '@hayasedb/contract'

export interface AnimeRelationSearchResult {
  id: string
  slug: string
  titleEnglish: string | null
  titleRomaji: string | null
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
  titleRomaji: string
  titleEnglish: string
  titleNative: string
  description: string
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
      state[field] =
        (anime as unknown as Record<string, unknown>)[field] ??
        emptyValue(field)
    }
    state.relationEdges = anime.relations.map(
      (relation): AnimeRelationEdgeItem => ({
        animeId: relation.anime.id,
        title: relation.anime.titleEnglish ?? '',
        kind: relation.kind,
      }),
    )
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

    if (empty === 'emptyArray') {
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
