import { describe, expect, it, vi } from 'vitest'
import type { ApiClient } from './orpc'
import { emptyAnimeStructure, fetchAnimeStructure } from './animeStructure'

const page = <T>(
  items: T[],
  orderEtag: string,
  nextCursor: string | null = null,
) => ({
  items,
  orderEtag,
  meta: { hasMore: nextCursor !== null, nextCursor },
})

const season = (id: string) => ({ id })
const episode = (id: string) => ({ id })

type PageFetcher = (input?: unknown) => Promise<unknown>

function clientOf(overrides: {
  seasons?: PageFetcher
  listForSeason?: PageFetcher
  listForAnime?: PageFetcher
}) {
  return {
    season: { list: overrides.seasons },
    episode: {
      listForSeason: overrides.listForSeason,
      listForAnime: overrides.listForAnime,
    },
  } as unknown as ApiClient
}

describe('fetchAnimeStructure', () => {
  it('keeps the order etag of each collection it reads', async () => {
    const api = clientOf({
      seasons: vi.fn().mockResolvedValue(page([season('s1')], '"seasons"')),
      listForSeason: vi
        .fn()
        .mockResolvedValue(page([episode('e1')], '"s1-episodes"')),
      listForAnime: vi.fn().mockResolvedValue(page([], '"direct"')),
    })

    const structure = await fetchAnimeStructure(api, 'anime-1')

    expect(structure.seasons.orderEtag).toBe('"seasons"')
    expect(structure.episodesBySeason.s1?.orderEtag).toBe('"s1-episodes"')
    expect(structure.episodesBySeason.s1?.items).toHaveLength(1)
  })

  it('follows cursors and keeps the first page etag for the whole collection', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce(page([season('s1')], '"first"', 'cursor-2'))
      .mockResolvedValueOnce(page([season('s2')], '"second"'))
    const api = clientOf({
      seasons: list,
      listForSeason: vi.fn().mockResolvedValue(page([], '"none"')),
      listForAnime: vi.fn().mockResolvedValue(page([], '"direct"')),
    })

    const structure = await fetchAnimeStructure(api, 'anime-1')

    expect(list).toHaveBeenCalledTimes(2)
    expect(structure.seasons.items.map((item) => item.id)).toEqual(['s1', 's2'])
    expect(structure.seasons.orderEtag).toBe('"first"')
  })

  it('reads direct episodes when the anime has no seasons', async () => {
    const listForAnime = vi
      .fn()
      .mockResolvedValue(page([episode('e1')], '"direct"'))
    const api = clientOf({
      seasons: vi.fn().mockResolvedValue(page([], '"empty"')),
      listForSeason: vi.fn(),
      listForAnime,
    })

    const structure = await fetchAnimeStructure(api, 'anime-1')

    expect(listForAnime).toHaveBeenCalledOnce()
    expect(structure.episodes.orderEtag).toBe('"direct"')
  })

  it('reads direct episodes even when seasons exist', async () => {
    const listForAnime = vi
      .fn()
      .mockResolvedValue(page([episode('e1')], '"direct"'))
    const api = clientOf({
      seasons: vi.fn().mockResolvedValue(page([season('s1')], '"seasons"')),
      listForSeason: vi.fn().mockResolvedValue(page([], '"none"')),
      listForAnime,
    })

    const structure = await fetchAnimeStructure(api, 'anime-1')

    expect(listForAnime).toHaveBeenCalledOnce()
    expect(structure.seasons.items.map((item) => item.id)).toEqual(['s1'])
    expect(structure.episodes.items.map((item) => item.id)).toEqual(['e1'])
  })

  it('starts empty', () => {
    expect(emptyAnimeStructure()).toEqual({
      seasons: { items: [], orderEtag: '' },
      episodes: { items: [], orderEtag: '' },
      episodesBySeason: {},
    })
  })
})
