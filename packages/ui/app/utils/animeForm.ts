import type { AnimeDetail } from '@hayasedb/contract'

type AnimeFormSource = Pick<
  AnimeDetail,
  | 'slug'
  | 'format'
  | 'status'
  | 'titleRomaji'
  | 'titleEnglish'
  | 'titleNative'
  | 'description'
  | 'startDate'
  | 'endDate'
  | 'genres'
>

export function buildAnimeFormState(anime?: AnimeFormSource | null) {
  return {
    slug: anime?.slug ?? '',
    format: anime?.format ?? null,
    status: anime?.status ?? null,
    titleRomaji: anime?.titleRomaji ?? '',
    titleEnglish: anime?.titleEnglish ?? '',
    titleNative: anime?.titleNative ?? '',
    description: anime?.description ?? '',
    startDate: anime?.startDate ?? '',
    endDate: anime?.endDate ?? '',
    genreIds: anime?.genres.map((g) => g.id) ?? [],
  }
}

export type AnimeFormState = ReturnType<typeof buildAnimeFormState>
