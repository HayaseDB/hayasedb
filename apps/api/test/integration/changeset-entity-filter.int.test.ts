import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  animeCreate,
  createTestApp,
  createTestHttp,
  INTERNAL_TOKEN,
  seasonCreate,
  signUpAdmin,
  signUpVerified,
  type TestApp,
  type TestHttp,
} from '../harness'

describe('changeset list, filtered to one entity', () => {
  let app: TestApp
  let admin: TestHttp
  let alice: TestHttp
  let animeId: string
  let otherAnimeId: string

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    alice = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpVerified(alice, app.mailer)

    animeId = randomUUID()
    const created = await alice.client.changeset.submit({
      summary: 'Create the filtered anime',
      changes: [animeCreate(animeId, 'filter-target')],
    })
    await admin.client.changeset.approve({ id: created.id })

    otherAnimeId = randomUUID()
    const otherCreated = await alice.client.changeset.submit({
      summary: 'Create an unrelated anime',
      changes: [animeCreate(otherAnimeId, 'filter-bystander')],
    })
    await admin.client.changeset.approve({ id: otherCreated.id })
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns only changesets touching the requested entity', async () => {
    const mine = await alice.client.changeset.submit({
      summary: 'Retitle the filtered anime',
      changes: [
        {
          op: 'update',
          entityKind: 'anime',
          entityId: animeId,
          baseRev: 1,
          payload: { slug: 'filter-target-renamed' },
        },
      ],
    })
    await alice.client.changeset.submit({
      summary: 'Retitle the bystander',
      changes: [
        {
          op: 'update',
          entityKind: 'anime',
          entityId: otherAnimeId,
          baseRev: 1,
          payload: { slug: 'filter-bystander-renamed' },
        },
      ],
    })

    const scoped = await admin.client.changeset.list({
      entityKind: 'anime',
      entityId: animeId,
      status: 'pending',
      limit: 20,
      offset: 0,
    })

    expect(scoped.items.map((item) => item.id)).toEqual([mine.id])
    expect(scoped.meta.total).toBe(scoped.items.length)
    expect(scoped.items[0]?.baseRev).toBe(1)
  })

  it('counts a changeset once even when it touches the entity repeatedly', async () => {
    const seasonId = randomUUID()
    const multi = await alice.client.changeset.submit({
      summary: 'Two changes against one anime',
      changes: [
        {
          op: 'update',
          entityKind: 'anime',
          entityId: animeId,
          baseRev: 1,
          payload: { slug: 'filter-target-twice' },
        },
        seasonCreate(seasonId, animeId, 1),
      ],
    })

    const scoped = await admin.client.changeset.list({
      entityKind: 'anime',
      entityId: animeId,
      status: 'pending',
      limit: 20,
      offset: 0,
    })

    expect(scoped.items.filter((item) => item.id === multi.id)).toHaveLength(1)
    expect(scoped.meta.total).toBe(scoped.items.length)
  })

  it('filters by entity kind alone, without an entity id', async () => {
    const seasonOnly = await alice.client.changeset.submit({
      summary: 'Add a season to the bystander',
      changes: [seasonCreate(randomUUID(), otherAnimeId, 2)],
    })

    const scoped = await admin.client.changeset.list({
      entityKind: 'animeSeason',
      status: 'pending',
      limit: 50,
      offset: 0,
    })

    expect(scoped.items.map((item) => item.id)).toContain(seasonOnly.id)
    expect(scoped.meta.total).toBe(scoped.items.length)

    const unscoped = await admin.client.changeset.list({
      status: 'pending',
      limit: 50,
      offset: 0,
    })
    expect(unscoped.meta.total).toBeGreaterThan(scoped.meta.total)
  })

  it('leaves the unfiltered admin queue untouched', async () => {
    const all = await admin.client.changeset.list({ limit: 50, offset: 0 })
    const scoped = await admin.client.changeset.list({
      entityKind: 'anime',
      entityId: animeId,
      limit: 50,
      offset: 0,
    })
    expect(all.meta.total).toBeGreaterThan(scoped.meta.total)
    expect(all.items.every((item) => item.baseRev === null)).toBe(true)
  })
})
