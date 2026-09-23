import {
  ANIME_FIELD_META,
  ANIME_FIELD_ORDER,
  canonicalizeRelation,
  isEmptyValue,
  isoToFuzzy,
  relationViewKind,
  sameFieldValue,
  type AnimeFieldKey,
  type AnimeRelationKind,
  type AnimeRelationViewKind,
  type FuzzyDate,
} from '@hayasedb/domain'
import type { ChangeKind } from '#imports'
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

export const ANIME_TRANSLATION_FIELDS = [
  'title',
  'description',
] as const satisfies readonly AnimeTranslationField[]

export const TRANSLATION_SET_PATH = '$set'

export function expandTranslationPaths(
  next: readonly Record<string, unknown>[] | undefined,
  base: readonly Record<string, unknown>[] | undefined,
  fields: readonly string[],
): string[] {
  const nextRows = next ?? []
  const baseRows = base ?? []
  const paths: string[] = []

  const byLocale = (rows: readonly Record<string, unknown>[]) =>
    new Map(rows.map((row) => [String(row.locale), row]))
  const nextByLocale = byLocale(nextRows)
  const baseByLocale = byLocale(baseRows)

  for (const [locale, row] of nextByLocale) {
    const before = baseByLocale.get(locale)
    if (!before) {
      paths.push(TRANSLATION_SET_PATH)
      for (const field of fields) {
        if (!isEmptyValue(row[field])) paths.push(`${locale}.${field}`)
      }
      continue
    }
    for (const field of fields) {
      if (!sameFieldValue(row[field], before[field])) {
        paths.push(`${locale}.${field}`)
      }
    }
    if (Boolean(row.original) !== Boolean(before.original)) {
      paths.push(TRANSLATION_SET_PATH)
    }
  }

  for (const locale of baseByLocale.keys()) {
    if (!nextByLocale.has(locale)) paths.push(TRANSLATION_SET_PATH)
  }

  return [...new Set(paths)]
}

export function expandAnimeTranslationPaths(
  next: readonly AnimeTranslation[] | undefined,
  base: readonly AnimeTranslation[] | undefined,
): string[] {
  return expandTranslationPaths(
    next as readonly Record<string, unknown>[] | undefined,
    base as readonly Record<string, unknown>[] | undefined,
    ANIME_TRANSLATION_FIELDS,
  )
}

export function relationEdgeKey(edge: AnimeRelationEdgeItem): string {
  return `${edge.animeId}:${edge.kind}`
}

export interface AnimeRelationRow {
  state: ChangeKind
  edge: AnimeRelationEdgeItem
  order: number
}

export function buildRelationRows(
  edges: readonly AnimeRelationEdgeItem[],
  baseline: readonly AnimeRelationEdgeItem[],
): AnimeRelationRow[] {
  const baselineKeys = new Set(baseline.map(relationEdgeKey))
  const consumed = new Set<string>()
  const rows: AnimeRelationRow[] = []

  baseline.forEach((base, index) => {
    const exact = edges.find(
      (edge) => relationEdgeKey(edge) === relationEdgeKey(base),
    )
    if (exact) {
      consumed.add(relationEdgeKey(exact))
      rows.push({ state: 'unchanged', edge: exact, order: index })
      return
    }
    const reassigned = edges.find(
      (edge) =>
        edge.animeId === base.animeId &&
        !baselineKeys.has(relationEdgeKey(edge)) &&
        !consumed.has(relationEdgeKey(edge)),
    )
    if (reassigned) {
      consumed.add(relationEdgeKey(reassigned))
      rows.push({ state: 'changed', edge: reassigned, order: index })
      return
    }
    rows.push({ state: 'removed', edge: base, order: index })
  })

  edges.forEach((edge, index) => {
    if (consumed.has(relationEdgeKey(edge))) return
    rows.push({ state: 'added', edge, order: baseline.length + index })
  })

  return rows.sort((a, b) => a.order - b.order)
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
