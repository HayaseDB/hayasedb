import type { AnimeEpisode, AnimeSeason, ChangeInput } from '@hayasedb/contract'
import {
  stableStringify,
  type AnimeEpisodeStatus,
  type AnimeEpisodeType,
  type AnimeSeasonKind,
  type LocalizationLocale,
} from '@hayasedb/domain'

type EpisodeSource = Pick<
  AnimeEpisode,
  | 'id'
  | 'headRev'
  | 'number'
  | 'type'
  | 'status'
  | 'airDate'
  | 'durationSeconds'
  | 'stillMediaId'
  | 'translations'
>

type SeasonSource = Pick<
  AnimeSeason,
  'id' | 'headRev' | 'kind' | 'number' | 'translations'
>

export interface StructureTitle {
  locale: LocalizationLocale
  title: string
  original: boolean
}

export interface EpisodeText extends StructureTitle {
  overview: string | null
}

export interface EpisodeDraft {
  id: string
  isNew: boolean
  removed: boolean
  baseRev: number | null
  number: string | null
  type: AnimeEpisodeType
  status: AnimeEpisodeStatus
  airDate: string | null
  durationSeconds: number | null
  stillMediaId: string | null
  translations: EpisodeText[]
}

export interface SeasonDraft {
  id: string
  isNew: boolean
  removed: boolean
  baseRev: number | null
  kind: AnimeSeasonKind
  number: string | null
  translations: StructureTitle[]
  episodes: EpisodeDraft[]
}

export interface AnimeStructureState {
  seasons: SeasonDraft[]
  episodes: EpisodeDraft[]
}

export type EpisodeOwner =
  { animeId: string; seasonId: null } | { animeId: null; seasonId: string }

export function emptyStructureState(): AnimeStructureState {
  return { seasons: [], episodes: [] }
}

function toEpisodeDraft(episode: EpisodeSource): EpisodeDraft {
  return {
    id: episode.id,
    isNew: false,
    removed: false,
    baseRev: episode.headRev,
    number: episode.number,
    type: episode.type,
    status: episode.status,
    airDate: episode.airDate,
    durationSeconds: episode.durationSeconds,
    stillMediaId: episode.stillMediaId,
    translations: episode.translations.map((translation) => ({
      ...translation,
    })),
  }
}

function toSeasonDraft(
  season: SeasonSource,
  episodes: EpisodeSource[],
): SeasonDraft {
  return {
    id: season.id,
    isNew: false,
    removed: false,
    baseRev: season.headRev,
    kind: season.kind,
    number: season.number,
    translations: season.translations.map((translation) => ({
      ...translation,
    })),
    episodes: episodes.map(toEpisodeDraft),
  }
}

export function buildStructureState(
  seasons: SeasonSource[],
  episodesBySeason: Record<string, EpisodeSource[]>,
  directEpisodes: EpisodeSource[],
): AnimeStructureState {
  return {
    seasons: seasons.map((season) =>
      toSeasonDraft(season, episodesBySeason[season.id] ?? []),
    ),
    episodes: directEpisodes.map(toEpisodeDraft),
  }
}

export function newEpisodeDraft(): EpisodeDraft {
  return {
    id: crypto.randomUUID(),
    isNew: true,
    removed: false,
    baseRev: null,
    number: null,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: null,
    durationSeconds: null,
    stillMediaId: null,
    translations: [{ locale: 'en', title: '', overview: null, original: true }],
  }
}

export function newSeasonDraft(): SeasonDraft {
  return {
    id: crypto.randomUUID(),
    isNew: true,
    removed: false,
    baseRev: null,
    kind: 'SEASON',
    number: null,
    translations: [{ locale: 'en', title: '', original: true }],
    episodes: [],
  }
}

function episodeDocument(
  draft: EpisodeDraft,
  owner: EpisodeOwner,
  position: number,
) {
  return {
    ...owner,
    number: draft.number,
    position,
    type: draft.type,
    status: draft.status,
    airDate: draft.airDate,
    durationSeconds: draft.durationSeconds,
    stillMediaId: draft.stillMediaId,
    translations: draft.translations.filter((item) => item.title.trim() !== ''),
  }
}

function seasonDocument(draft: SeasonDraft, animeId: string, position: number) {
  return {
    animeId,
    kind: draft.kind,
    number: draft.number,
    position,
    translations: draft.translations.filter((item) => item.title.trim() !== ''),
  }
}

function changedFrom(next: unknown, previous: unknown): boolean {
  return stableStringify(next) !== stableStringify(previous)
}

interface EpisodePlacement {
  episode: EpisodeDraft
  owner: EpisodeOwner
  position: number
}

function baselinePlacements(
  animeId: string,
  baseline: AnimeStructureState,
): Map<string, EpisodePlacement> {
  const placements = new Map<string, EpisodePlacement>()
  for (const season of baseline.seasons) {
    season.episodes.forEach((episode, position) => {
      placements.set(episode.id, {
        episode,
        owner: { animeId: null, seasonId: season.id },
        position,
      })
    })
  }
  baseline.episodes.forEach((episode, position) => {
    placements.set(episode.id, {
      episode,
      owner: { animeId, seasonId: null },
      position,
    })
  })
  return placements
}

export function planStructureChanges(
  animeId: string,
  next: AnimeStructureState,
  baseline: AnimeStructureState,
): ChangeInput[] {
  const changes: ChangeInput[] = []
  const baseSeasons = new Map(
    baseline.seasons.map((season) => [season.id, season]),
  )
  const basePlacements = baselinePlacements(animeId, baseline)

  const pushEpisode = (
    draft: EpisodeDraft,
    owner: EpisodeOwner,
    position: number,
  ) => {
    if (draft.removed) {
      if (!draft.isNew && draft.baseRev !== null) {
        changes.push({
          op: 'delete',
          entityKind: 'animeEpisode',
          entityId: draft.id,
          baseRev: draft.baseRev,
        })
      }
      return
    }

    const document = episodeDocument(draft, owner, position)

    if (draft.isNew) {
      changes.push({
        op: 'create',
        entityKind: 'animeEpisode',
        entityId: draft.id,
        payload: document,
      })
      return
    }

    const placement = basePlacements.get(draft.id)
    if (!placement || draft.baseRev === null) return
    const previousDocument = episodeDocument(
      placement.episode,
      placement.owner,
      placement.position,
    )
    if (changedFrom(document, previousDocument)) {
      changes.push({
        op: 'update',
        entityKind: 'animeEpisode',
        entityId: draft.id,
        baseRev: draft.baseRev,
        payload: document,
      })
    }
  }

  next.seasons.forEach((season, seasonIndex) => {
    if (season.removed) {
      if (!season.isNew && season.baseRev !== null) {
        changes.push({
          op: 'delete',
          entityKind: 'animeSeason',
          entityId: season.id,
          baseRev: season.baseRev,
        })
      }
      return
    }

    const document = seasonDocument(season, animeId, seasonIndex)

    if (season.isNew) {
      changes.push({
        op: 'create',
        entityKind: 'animeSeason',
        entityId: season.id,
        payload: document,
      })
    } else {
      const previous = baseSeasons.get(season.id)
      if (previous && season.baseRev !== null) {
        const previousDocument = seasonDocument(
          previous,
          animeId,
          baseline.seasons.findIndex((item) => item.id === season.id),
        )
        if (changedFrom(document, previousDocument)) {
          changes.push({
            op: 'update',
            entityKind: 'animeSeason',
            entityId: season.id,
            baseRev: season.baseRev,
            payload: document,
          })
        }
      }
    }

    season.episodes.forEach((episode, index) => {
      pushEpisode(episode, { animeId: null, seasonId: season.id }, index)
    })
  })

  next.episodes.forEach((episode, index) => {
    pushEpisode(episode, { animeId, seasonId: null }, index)
  })

  return changes
}

export function countStructureChanges(
  animeId: string,
  next: AnimeStructureState,
  baseline: AnimeStructureState,
): number {
  return planStructureChanges(animeId, next, baseline).length
}

interface PrefillChange {
  entityKind: string
  entityId: string
  op: string
  payload: Record<string, unknown>
}

const asString = (value: unknown) => (typeof value === 'string' ? value : null)

const asNumber = (value: unknown) => (typeof value === 'number' ? value : null)

function asTranslationRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === 'object',
      )
    : []
}

const asTranslations = (value: unknown): StructureTitle[] =>
  asTranslationRows(value).flatMap((row) => {
    const locale = asString(row.locale)
    const title = asString(row.title)
    if (!locale || title === null) return []
    return [
      {
        locale: locale as LocalizationLocale,
        title,
        original: row.original === true,
      },
    ]
  })

const asEpisodeTexts = (value: unknown): EpisodeText[] =>
  asTranslationRows(value).flatMap((row) => {
    const locale = asString(row.locale)
    const title = asString(row.title)
    if (!locale || title === null) return []
    return [
      {
        locale: locale as LocalizationLocale,
        title,
        original: row.original === true,
        overview: asString(row.overview),
      },
    ]
  })

export function applyStructurePrefill(
  state: AnimeStructureState,
  changes: PrefillChange[],
): void {
  const seasonById = new Map(state.seasons.map((season) => [season.id, season]))

  for (const change of changes) {
    if (change.entityKind !== 'animeSeason') continue
    const { payload } = change

    if (change.op === 'delete') {
      const existing = seasonById.get(change.entityId)
      if (existing) existing.removed = true
      continue
    }

    const existing = seasonById.get(change.entityId)
    const season: SeasonDraft = existing ?? {
      ...newSeasonDraft(),
      id: change.entityId,
    }
    if ('kind' in payload) {
      season.kind = (payload.kind as SeasonDraft['kind']) ?? season.kind
    }
    if ('number' in payload) season.number = asString(payload.number)
    if ('translations' in payload) {
      season.translations = asTranslations(payload.translations)
    }

    if (!existing) {
      state.seasons.push(season)
      seasonById.set(season.id, season)
    }
  }

  const episodeById = new Map<string, EpisodeDraft>()
  for (const episode of state.episodes) episodeById.set(episode.id, episode)
  for (const season of state.seasons) {
    for (const episode of season.episodes) episodeById.set(episode.id, episode)
  }

  for (const change of changes) {
    if (change.entityKind !== 'animeEpisode') continue
    const { payload } = change

    if (change.op === 'delete') {
      const existing = episodeById.get(change.entityId)
      if (existing) existing.removed = true
      continue
    }

    const existing = episodeById.get(change.entityId)
    const episode: EpisodeDraft = existing ?? {
      ...newEpisodeDraft(),
      id: change.entityId,
    }
    if ('number' in payload) episode.number = asString(payload.number)
    if ('type' in payload) {
      episode.type = (payload.type as EpisodeDraft['type']) ?? episode.type
    }
    if ('status' in payload) {
      episode.status =
        (payload.status as EpisodeDraft['status']) ?? episode.status
    }
    if ('airDate' in payload) episode.airDate = asString(payload.airDate)
    if ('durationSeconds' in payload) {
      episode.durationSeconds = asNumber(payload.durationSeconds)
    }
    if ('stillMediaId' in payload) {
      episode.stillMediaId = asString(payload.stillMediaId)
    }
    if ('translations' in payload) {
      episode.translations = asEpisodeTexts(payload.translations)
    }

    if (existing) continue
    const seasonId = asString(payload.seasonId)
    const owner = seasonId ? seasonById.get(seasonId) : undefined
    if (owner) owner.episodes.push(episode)
    else state.episodes.push(episode)
    episodeById.set(episode.id, episode)
  }
}
