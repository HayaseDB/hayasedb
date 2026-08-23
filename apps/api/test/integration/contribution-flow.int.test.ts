import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  animeCreate,
  createTestApp,
  createTestHttp,
  errorOf,
  INTERNAL_TOKEN,
  signUp,
  signUpAdmin,
  signUpVerified,
  type TestApp,
  type TestHttp,
} from '../harness'

describe('contribution flow', () => {
  let app: TestApp
  let admin: TestHttp
  let alice: TestHttp
  let bob: TestHttp
  let aliceId: string

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    alice = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    aliceId = (await signUpVerified(alice, app.mailer)).id
    bob = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpVerified(bob, app.mailer)
  })

  afterAll(async () => {
    await app.close()
  })

  it('requires a verified account to submit', async () => {
    const fresh = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUp(fresh)
    const error = await errorOf(
      fresh.client.changeset.submit({
        summary: 'Add something',
        changes: [animeCreate(randomUUID(), 'unverified')],
      }),
    )
    expect(error?.code).toBe('FORBIDDEN')
    const anon = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    const unauthorized = await errorOf(
      anon.client.changeset.submit({
        summary: 'Add something',
        changes: [animeCreate(randomUUID(), 'anon')],
      }),
    )
    expect(unauthorized?.code).toBe('UNAUTHORIZED')
  })

  it('submits a pending changeset with pre-minted ids, server-assigned ord and old values', async () => {
    const existing = await admin.client.anime.create({
      slug: 'existing',
      titleEnglish: 'Old',
    })
    const animeId = randomUUID()
    const genreId = randomUUID()
    const detail = await alice.client.changeset.submit({
      summary: 'New anime with a new genre',
      changes: [
        animeCreate(animeId, 'fresh-anime', {
          genreIds: [genreId],
          titleEnglish: 'Fresh',
        }),
        {
          op: 'update',
          entityKind: 'anime',
          entityId: existing.id,
          baseRev: 1,
          payload: { titleEnglish: 'New' },
        },
        {
          op: 'create',
          entityKind: 'genre',
          entityId: genreId,
          payload: { name: 'Isekai' },
        },
      ],
    })
    expect(detail).toMatchObject({
      status: 'pending',
      author: { id: aliceId },
      changeCount: 3,
    })
    expect(detail.changes.map((c) => [c.ord, c.entityKind, c.op])).toEqual([
      [0, 'genre', 'create'],
      [1, 'anime', 'create'],
      [2, 'anime', 'update'],
    ])
    const update = detail.changes.find((c) => c.op === 'update')
    expect(update).toMatchObject({
      baseRev: 1,
      oldValues: { titleEnglish: 'Old' },
      headRev: 1,
      conflicted: false,
    })
    expect(detail.display.refs.genre?.[genreId]).toBe('Isekai')
    expect([...new Set(detail.entityKinds)].sort()).toEqual(['anime', 'genre'])

    const missing = await errorOf(
      alice.client.anime.getBySlug({ slug: 'fresh-anime' }),
    )
    expect(missing?.code).toBe('NOT_FOUND')
  })

  describe('rejects invalid submissions before storing anything', () => {
    let created: { id: string }
    const existing = () => created

    beforeAll(async () => {
      created = await admin.client.anime.create({ slug: 'dupe-target' })
    })

    it.each<
      [
        string,
        () => Parameters<typeof alice.client.changeset.submit>[0],
        string,
      ]
    >([
      [
        'duplicate entity in one changeset',
        () => ({
          summary: 'duplicate',
          changes: [
            animeCreate(existing().id, 'x'),
            {
              op: 'delete',
              entityKind: 'anime',
              entityId: existing().id,
              baseRev: 1,
            },
          ],
        }),
        'CONFLICT',
      ],
      [
        'slug already taken',
        () => ({
          summary: 'taken',
          changes: [animeCreate(randomUUID(), 'dupe-target')],
        }),
        'CONFLICT',
      ],
      [
        'existing entity id on create',
        () => ({
          summary: 'same id',
          changes: [animeCreate(existing().id, 'other-slug')],
        }),
        'CONFLICT',
      ],
      [
        'base revision ahead of head',
        () => ({
          summary: 'ahead',
          changes: [
            {
              op: 'update',
              entityKind: 'anime',
              entityId: existing().id,
              baseRev: 5,
              payload: { description: 'x' },
            },
          ],
        }),
        'CONFLICT',
      ],
      [
        'unknown entity',
        () => ({
          summary: 'ghost',
          changes: [
            {
              op: 'update',
              entityKind: 'anime',
              entityId: randomUUID(),
              baseRev: 1,
              payload: { description: 'x' },
            },
          ],
        }),
        'NOT_FOUND',
      ],
      [
        'unknown genre reference',
        () => ({
          summary: 'ref',
          changes: [
            animeCreate(randomUUID(), 'ref-slug', { genreIds: [randomUUID()] }),
          ],
        }),
        'NOT_FOUND',
      ],
      [
        'empty patch',
        () => ({
          summary: 'empty',
          changes: [
            {
              op: 'update',
              entityKind: 'anime',
              entityId: existing().id,
              baseRev: 1,
              payload: {},
            },
          ],
        }),
        'BAD_REQUEST',
      ],
      [
        'short summary',
        () => ({
          summary: 'ab',
          changes: [animeCreate(randomUUID(), 'short')],
        }),
        'BAD_REQUEST',
      ],
    ])('%s', async (_label, input, code) => {
      const error = await errorOf(alice.client.changeset.submit(input()))
      expect(error?.code, error?.message).toBe(code)
    })

    it('stores nothing for rejected submissions', async () => {
      const mine = await alice.client.changeset.list({ mine: true })
      expect(mine.items.map((i) => i.summary)).not.toContain('duplicate')
    })
  })

  it('scopes reads and messages to the author or admins', async () => {
    const detail = await alice.client.changeset.submit({
      summary: 'Private to alice',
      changes: [animeCreate(randomUUID(), 'private-alice')],
    })
    expect((await alice.client.changeset.get({ id: detail.id })).id).toBe(
      detail.id,
    )
    expect((await admin.client.changeset.get({ id: detail.id })).id).toBe(
      detail.id,
    )
    const hidden = await errorOf(bob.client.changeset.get({ id: detail.id }))
    expect(hidden?.code).toBe('NOT_FOUND')

    await alice.client.changeset.addMessage({
      id: detail.id,
      body: 'Please review',
    })
    await admin.client.changeset.addMessage({ id: detail.id, body: 'Looking' })
    const stranger = await errorOf(
      bob.client.changeset.addMessage({ id: detail.id, body: 'Hi' }),
    )
    expect(stranger?.code).toBe('NOT_FOUND')
    const after = await alice.client.changeset.get({ id: detail.id })
    expect(after.messages.map((m) => [m.kind, m.body])).toEqual([
      ['comment', 'Please review'],
      ['comment', 'Looking'],
    ])

    const bobList = await bob.client.changeset.list({ mine: true })
    expect(bobList.items.map((i) => i.id)).not.toContain(detail.id)
    const adminQueue = await admin.client.changeset.list({})
    expect(adminQueue.items.map((i) => i.id)).toContain(detail.id)
    const queueDenied = await errorOf(alice.client.changeset.list({}))
    expect(queueDenied?.code).toBe('FORBIDDEN')
  })

  it('withdraws only pending changesets and only by the author', async () => {
    const detail = await alice.client.changeset.submit({
      summary: 'To withdraw',
      changes: [animeCreate(randomUUID(), 'withdraw-me')],
    })
    const notOwner = await errorOf(
      bob.client.changeset.withdraw({ id: detail.id }),
    )
    expect(notOwner?.code).toBe('NOT_FOUND')
    const withdrawn = await alice.client.changeset.withdraw({ id: detail.id })
    expect(withdrawn.status).toBe('withdrawn')
    expect(withdrawn.decidedAt).not.toBeNull()
    const again = await errorOf(
      alice.client.changeset.withdraw({ id: detail.id }),
    )
    expect(again?.code).toBe('CONFLICT')
    const approve = await errorOf(
      admin.client.changeset.approve({ id: detail.id }),
    )
    expect(approve?.code).toBe('CONFLICT')
  })

  it('supersedes a pending changeset with a revised submission', async () => {
    const entityId = randomUUID()
    const first = await alice.client.changeset.submit({
      summary: 'First try',
      changes: [animeCreate(entityId, 'first-try')],
    })
    const second = await alice.client.changeset.submit({
      summary: 'Second try',
      changes: [animeCreate(entityId, 'second-try')],
      supersedesId: first.id,
    })
    expect(second.supersedesId).toBe(first.id)
    const old = await alice.client.changeset.get({ id: first.id })
    expect(old).toMatchObject({
      status: 'superseded',
      supersededById: second.id,
    })

    const bobSteal = await errorOf(
      bob.client.changeset.submit({
        summary: 'Steal',
        changes: [animeCreate(randomUUID(), 'steal')],
        supersedesId: second.id,
      }),
    )
    expect(bobSteal?.code).toBe('NOT_FOUND')
    const twice = await errorOf(
      alice.client.changeset.submit({
        summary: 'Supersede superseded',
        changes: [animeCreate(randomUUID(), 'third-try')],
        supersedesId: first.id,
      }),
    )
    expect(twice?.code).toBe('CONFLICT')
  })

  it('caps pending changesets per author at 10', async () => {
    const capped = createTestHttp(app.baseUrl, {
      internalToken: INTERNAL_TOKEN,
    })
    const user = await signUpVerified(capped, app.mailer)
    const existing = await app.db
      .select({ id: schema.changeset.id })
      .from(schema.changeset)
      .where(eq(schema.changeset.authorId, user.id))
    expect(existing).toHaveLength(0)
    for (let i = 0; i < 10; i += 1) {
      await capped.client.changeset.submit({
        summary: `Pending ${i}`,
        changes: [animeCreate(randomUUID(), `pending-${i}`)],
      })
    }
    const eleventh = await errorOf(
      capped.client.changeset.submit({
        summary: 'Pending 10',
        changes: [animeCreate(randomUUID(), 'pending-10')],
      }),
    )
    expect(eleventh?.code).toBe('FORBIDDEN')
    const list = await capped.client.changeset.list({
      mine: true,
      status: 'pending',
      limit: 5,
      offset: 0,
    })
    expect(list.meta.total).toBe(10)
    expect(list.items).toHaveLength(5)
  })
})
