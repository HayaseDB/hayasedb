import type { ApiClient } from '#imports'

type AnimeDetail = Awaited<ReturnType<ApiClient['anime']['get']>>

export async function resolveAnimeBySlug(
  api: ApiClient,
  slug: string,
): Promise<AnimeDetail | null> {
  const { items } = await api.anime.list({ slug, limit: 1 })
  const match = items[0]
  if (!match) return null
  return api.anime.get({ id: match.id })
}
