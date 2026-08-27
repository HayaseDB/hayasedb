import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTestApp,
  createTestHttp,
  errorOf,
  INTERNAL_TOKEN,
  signUpAdmin,
  type TestApp,
  type TestHttp,
} from '../harness'

describe('anime cursor pagination', () => {
  let app: TestApp
  let admin: TestHttp

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    for (const slug of ['cur-a', 'cur-b', 'cur-c', 'cur-d', 'cur-e']) {
      await admin.client.anime.create({ slug, titleEnglish: slug })
    }
  })

  afterAll(async () => {
    await app.close()
  })

  it('walks the whole collection exactly once with no gaps or repeats', async () => {
    const seen: string[] = []
    let cursor: string | undefined
    for (let guard = 0; guard < 10; guard++) {
      const page = await admin.client.anime.list({
        sort: 'title',
        limit: 2,
        cursor,
      })
      seen.push(...page.items.map((a) => a.slug))
      if (!page.meta.hasMore) {
        expect(page.meta.nextCursor).toBeNull()
        break
      }
      expect(page.meta.nextCursor).toEqual(expect.any(String))
      cursor = page.meta.nextCursor ?? undefined
    }

    expect(seen).toEqual(['cur-a', 'cur-b', 'cur-c', 'cur-d', 'cur-e'])
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('matches the equivalent offset page', async () => {
    const first = await admin.client.anime.list({ sort: 'title', limit: 2 })
    const viaCursor = await admin.client.anime.list({
      sort: 'title',
      limit: 2,
      cursor: first.meta.nextCursor!,
    })
    const viaOffset = await admin.client.anime.list({
      sort: 'title',
      limit: 2,
      offset: 2,
    })
    expect(viaCursor.items.map((a) => a.slug)).toEqual(
      viaOffset.items.map((a) => a.slug),
    )
  })

  it('rejects a cursor minted under a different sort', async () => {
    const first = await admin.client.anime.list({ sort: 'title', limit: 2 })
    const error = await errorOf(
      admin.client.anime.list({
        sort: '-createdAt',
        limit: 2,
        cursor: first.meta.nextCursor!,
      }),
    )
    expect(error?.code).toBe('BAD_REQUEST')
  })

  it('rejects a malformed cursor', async () => {
    const error = await errorOf(
      admin.client.anime.list({
        sort: 'title',
        limit: 2,
        cursor: 'not-a-cursor',
      }),
    )
    expect(error?.code).toBe('BAD_REQUEST')
  })

  it('offers no cursor for a sort that cannot be keyset-paged', async () => {
    const page = await admin.client.anime.list({ sort: '-startDate', limit: 2 })
    expect(page.meta.nextCursor).toBeNull()
  })
})
