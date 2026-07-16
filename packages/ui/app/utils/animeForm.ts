import {
  ANIME_FIELD_META,
  ANIME_FIELD_ORDER,
  type AnimeFieldKey,
} from '@hayasedb/domain'
import type { AnimeDetail, AnimeFormat, AnimeStatus } from '@hayasedb/contract'

export interface AnimeFormState {
  slug: string
  format: AnimeFormat | null
  status: AnimeStatus | null
  titleRomaji: string
  titleEnglish: string
  titleNative: string
  description: string
  startDate: string
  endDate: string
  genreIds: string[]
}

type AnimeFormSource = Pick<
  AnimeDetail,
  Exclude<keyof AnimeFormState, 'genreIds'> | 'genres'
>

const FORM_FIELDS = ANIME_FIELD_ORDER.filter(
  (field): field is Exclude<AnimeFieldKey, 'media'> => field !== 'media',
)

function emptyValue(field: Exclude<AnimeFieldKey, 'media'>): unknown {
  const { empty } = ANIME_FIELD_META[field]
  return empty === 'emptyArray' ? [] : empty
}

export function buildAnimeFormState(
  anime?: AnimeFormSource | null,
): AnimeFormState {
  const state: Record<string, unknown> = {}

  for (const field of FORM_FIELDS) {
    state[field] = emptyValue(field)
  }

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
  }

  return state as unknown as AnimeFormState
}

export function applyPayloadToState(
  target: AnimeFormState,
  payload: Record<string, unknown>,
): void {
  const state = target as unknown as Record<string, unknown>

  for (const field of FORM_FIELDS) {
    if (!(field in payload)) continue
    const value = payload[field]
    const { empty } = ANIME_FIELD_META[field]

    if (empty === 'emptyArray') {
      state[field] = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : []
    } else if (empty === '') {
      state[field] = typeof value === 'string' ? value : ''
    } else {
      state[field] = value ?? null
    }
  }
}
