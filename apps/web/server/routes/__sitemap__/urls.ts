import { INTERNAL_TOKEN_HEADER } from '@hayasedb/contract'
import type { SitemapUrlInput } from '#sitemap/types'

interface AnimeListResponse {
  items: { slug: string; updatedAt: string }[]
  meta: { total: number; limit: number; offset: number }
}

const PAGE_SIZE = 100
const MAX_PAGES = 200

export default defineSitemapEventHandler(
  async (): Promise<SitemapUrlInput[]> => {
    const config = useRuntimeConfig()
    const headers: Record<string, string> = {}
    if (config.internalToken) {
      headers[INTERNAL_TOKEN_HEADER] = config.internalToken
    }

    const urls: SitemapUrlInput[] = []

    try {
      for (let page = 0; page < MAX_PAGES; page++) {
        const offset = page * PAGE_SIZE
        const response = await $fetch<AnimeListResponse>(
          `${config.apiUrl}/api/anime`,
          {
            headers,
            query: {
              limit: PAGE_SIZE,
              offset,
              sort: 'recent',
              order: 'desc',
            },
          },
        )

        const items = response?.items ?? []
        for (const item of items) {
          urls.push({
            loc: `/anime/${item.slug}`,
            lastmod: item.updatedAt,
          })
        }

        if (items.length < PAGE_SIZE) break
        if (offset + items.length >= (response?.meta?.total ?? 0)) break
      }
    } catch (error) {
      console.error('[sitemap] failed to load anime urls', error)
      return []
    }

    return urls
  },
)
