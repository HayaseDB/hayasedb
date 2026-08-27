import { ORPCError } from '@orpc/client'
import type { animeDocumentSchema } from '@hayasedb/contract'
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

export const animeCreate = (
  entityId: string,
  slug: string,
  extra: Partial<z.input<typeof animeDocumentSchema>> = {},
): ChangeInput => ({
  op: 'create',
  entityKind: 'anime',
  entityId,
  payload: { slug, genreIds: [], media: [], ...extra },
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
