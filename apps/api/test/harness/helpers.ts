import { ORPCError } from '@orpc/client'
import type {
  animeDocumentSchema,
  animeEpisodeDocumentSchema,
  animeSeasonDocumentSchema,
  createAnimeInputSchema,
} from '@hayasedb/contract'
import type * as z from 'zod'
import { createTestHttp, type TestClient } from './client'
import { INTERNAL_TOKEN, type TestApp } from './create-test-app'

export const errorOf = (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (error: unknown) => error as ORPCError<string, unknown>,
  )

export const internal = (app: TestApp, extra: Record<string, string> = {}) =>
  createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN, ...extra })

export type ChangeInput = Parameters<
  TestClient['changeset']['submit']
>[0]['changes'][number]

export const createAnimeInput = (
  slug: string,
  extra: Partial<z.input<typeof createAnimeInputSchema>> = {},
): z.input<typeof createAnimeInputSchema> => ({
  slug,
  translations: [
    { locale: 'en', title: slug, description: null, original: true },
  ],
  ...extra,
})

export const animeCreate = (
  entityId: string,
  slug: string,
  extra: Partial<z.input<typeof animeDocumentSchema>> = {},
): ChangeInput => ({
  op: 'create',
  entityKind: 'anime',
  entityId,
  payload: {
    slug,
    translations: [
      { locale: 'en', title: slug, description: null, original: true },
    ],
    genreIds: [],
    media: [],
    ...extra,
  },
})

export const seasonCreate = (
  entityId: string,
  animeId: string,
  position: number,
  extra: Partial<z.input<typeof animeSeasonDocumentSchema>> = {},
): ChangeInput => ({
  op: 'create',
  entityKind: 'animeSeason',
  entityId,
  payload: {
    animeId,
    kind: 'SEASON',
    number: String(position + 1),
    position,
    translations: [
      { locale: 'en', title: `Season ${position + 1}`, original: true },
    ],
    ...extra,
  },
})

export const episodeCreate = (
  entityId: string,
  owner: { animeId: string } | { seasonId: string },
  position: number,
  extra: Partial<z.input<typeof animeEpisodeDocumentSchema>> = {},
): ChangeInput => ({
  op: 'create',
  entityKind: 'animeEpisode',
  entityId,
  payload: {
    animeId: 'animeId' in owner ? owner.animeId : null,
    seasonId: 'seasonId' in owner ? owner.seasonId : null,
    number: String(position + 1),
    position,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: null,
    durationSeconds: null,
    stillMediaId: null,
    translations: [
      {
        locale: 'en',
        title: `Episode ${position + 1}`,
        overview: null,
        original: true,
      },
    ],
    ...extra,
  },
})

export const animeBySlug = async (
  client: TestClient,
  slug: string,
  opts: { includeDeleted?: boolean } = {},
) => {
  const { items } = await client.anime.list({
    slug,
    limit: 1,
    includeDeleted: opts.includeDeleted,
  })
  const match = items[0]
  if (!match) {
    throw new ORPCError('NOT_FOUND', { message: 'Anime not found' })
  }
  return client.anime.get({ id: match.id })
}
