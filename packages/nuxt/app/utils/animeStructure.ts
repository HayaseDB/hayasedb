import type { ApiClient } from './orpc'

export type AnimeSeasonItem = Awaited<
  ReturnType<ApiClient['season']['list']>
>['items'][number]

export type AnimeEpisodeItem = Awaited<
  ReturnType<ApiClient['episode']['listForSeason']>
>['items'][number]

const MAX_PAGES = 40
const PAGE_SIZE = 100

interface OrderedCollection<T> {
  items: T[]
  orderEtag: string
}

export interface SeasonCollection {
  items: AnimeSeasonItem[]
  orderEtag: string
}

export interface EpisodeCollection {
  items: AnimeEpisodeItem[]
  orderEtag: string
}

export interface AnimeStructure {
  seasons: SeasonCollection
  episodes: EpisodeCollection
  episodesBySeason: Record<string, EpisodeCollection>
}

interface OrderedPage<T> extends OrderedCollection<T> {
  meta: { hasMore: boolean; nextCursor: string | null }
}

export function emptyAnimeStructure(): AnimeStructure {
  return {
    seasons: { items: [], orderEtag: '' },
    episodes: { items: [], orderEtag: '' },
    episodesBySeason: {},
  }
}

async function collectOrdered<T>(
  fetchPage: (cursor?: string) => PromiseLike<OrderedPage<T>>,
): Promise<OrderedCollection<T>> {
  const items: T[] = []
  let orderEtag = ''
  let cursor: string | undefined

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchPage(cursor)
    items.push(...result.items)
    if (page === 0) orderEtag = result.orderEtag
    if (!result.meta.hasMore || !result.meta.nextCursor) break
    cursor = result.meta.nextCursor
  }

  return { items, orderEtag }
}

export function fetchSeasons(
  api: ApiClient,
  animeId: string,
): Promise<SeasonCollection> {
  return collectOrdered((cursor) =>
    api.season.list({ animeId, limit: PAGE_SIZE, cursor }),
  )
}

export function fetchSeasonEpisodes(
  api: ApiClient,
  seasonId: string,
): Promise<EpisodeCollection> {
  return collectOrdered((cursor) =>
    api.episode.listForSeason({ seasonId, limit: PAGE_SIZE, cursor }),
  )
}

export function fetchAnimeEpisodes(
  api: ApiClient,
  animeId: string,
): Promise<EpisodeCollection> {
  return collectOrdered((cursor) =>
    api.episode.listForAnime({ animeId, limit: PAGE_SIZE, cursor }),
  )
}

export async function fetchAnimeStructure(
  api: ApiClient,
  animeId: string,
): Promise<AnimeStructure> {
  const seasons = await fetchSeasons(api, animeId)

  const perSeason = await Promise.all(
    seasons.items.map(async (season) => {
      const episodes = await fetchSeasonEpisodes(api, season.id)
      return [season.id, episodes] as const
    }),
  )

  return {
    seasons,
    episodes: await fetchAnimeEpisodes(api, animeId),
    episodesBySeason: Object.fromEntries(perSeason),
  }
}
