import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  animeBySlug,
  animeCreate,
  createTestApp,
  createTestHttp,
  errorOf,
  INTERNAL_TOKEN,
  signUpAdmin,
  signUpVerified,
  type TestApp,
  type TestHttp,
} from '../harness'

describe('changeset apply and moderation', () => {
  let app: TestApp
  let admin: TestHttp
  let adminId: string
  let user: TestHttp
  let userId: string

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    adminId = (await signUpAdmin(admin, app.mailer, app.db)).id
    user = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    userId = (await signUpVerified(user, app.mailer)).id
  })

  afterAll(async () => {
    await app.close()
  })

  it('forbids moderation for non-admins', async () => {
    const submitted = await user.client.changeset.submit({
      summary: 'User work',
      changes: [animeCreate(randomUUID(), 'user-work')],
    })
    for (const call of [
      () => user.client.changeset.approve({ id: submitted.id }),
      () => user.client.changeset.reject({ id: submitted.id, reason: 'no' }),
      () => user.client.changeset.stats(),
      () => user.client.changeset.revert({ id: submitted.id }),
      () =>
        user.client.revision.list({
          entityKind: 'anime',
          entityId: submitted.changes[0]!.entityId,
        }),
    ]) {
      const error = await errorOf(call())
      expect(error?.code).toBe('FORBIDDEN')
    }
  })

  it('approves a multi-entity changeset atomically and records revisions', async () => {
    const animeId = randomUUID()
    const genreId = randomUUID()
    const submitted = await user.client.changeset.submit({
      summary: 'Anime with new genre',
      changes: [
        {
          op: 'create',
          entityKind: 'anime',
          entityId: animeId,
          payload: {
            slug: 'approved-anime',
            genreIds: [genreId],
            media: [],
            titleEnglish: 'Approved',
          },
        },
        {
          op: 'create',
          entityKind: 'genre',
          entityId: genreId,
          payload: { name: 'Approved Genre' },
        },
      ],
    })
    const before = await admin.client.changeset.stats()
    const approved = await admin.client.changeset.approve({ id: submitted.id })
    expect(approved).toMatchObject({
      status: 'approved',
      decidedBy: { id: adminId },
    })
    expect(
      approved.changes.every((c) => c.appliedRevisionId && !c.conflicted),
    ).toBe(true)
    expect((await admin.client.changeset.stats()).pending).toBe(
      before.pending - 1,
    )

    const anime = await animeBySlug(user.client, 'approved-anime')
    expect(anime).toMatchObject({
      id: animeId,
      titleEnglish: 'Approved',
      headRev: 1,
      genres: [{ id: genreId, name: 'Approved Genre' }],
    })

    const history = await admin.client.revision.list({
      entityKind: 'anime',
      entityId: animeId,
    })
    expect(history.items).toHaveLength(1)
    expect(history.items[0]).toMatchObject({
      rev: 1,
      op: 'create',
      editor: { id: userId },
      changesetId: submitted.id,
      changesetSummary: 'Anime with new genre',
    })

    const again = await errorOf(
      admin.client.changeset.approve({ id: submitted.id }),
    )
    expect(again?.code).toBe('CONFLICT')
  })

  it('applies a stale update when the intervening edits touched other fields', async () => {
    const anime = await admin.client.anime.create({
      slug: 'stale-ok',
      titleEnglish: 'T',
      description: 'D',
    })
    const submitted = await user.client.changeset.submit({
      summary: 'Change title',
      changes: [
        {
          op: 'update',
          entityKind: 'anime',
          entityId: anime.id,
          baseRev: 1,
          payload: { titleEnglish: 'T2' },
        },
      ],
    })
    await admin.client.anime.update({ id: anime.id, description: 'D2' })
    const approved = await admin.client.changeset.approve({ id: submitted.id })
    expect(approved.status).toBe('approved')
    const after = await user.client.anime.get({ id: anime.id })
    expect(after).toMatchObject({
      titleEnglish: 'T2',
      description: 'D2',
      headRev: 3,
    })
  })

  it('blocks a stale update on overlapping fields, keeps it pending with a system message, and applies after resubmission', async () => {
    const anime = await admin.client.anime.create({
      slug: 'stale-bad',
      titleEnglish: 'T',
    })
    const submitted = await user.client.changeset.submit({
      summary: 'Change title',
      changes: [
        {
          op: 'update',
          entityKind: 'anime',
          entityId: anime.id,
          baseRev: 1,
          payload: { titleEnglish: 'Mine' },
        },
      ],
    })
    await admin.client.anime.update({ id: anime.id, titleEnglish: 'Theirs' })

    const blocked = await admin.client.changeset.approve({ id: submitted.id })
    expect(blocked.status).toBe('pending')
    expect(blocked.changes[0]).toMatchObject({
      conflicted: true,
      headRev: 2,
      currentValues: { titleEnglish: 'Theirs' },
    })
    expect(blocked.messages.at(-1)).toMatchObject({ kind: 'system' })
    expect(blocked.messages.at(-1)?.body).toContain(
      'conflicting fields: titleEnglish',
    )
    expect((await user.client.anime.get({ id: anime.id })).titleEnglish).toBe(
      'Theirs',
    )

    const resubmitted = await user.client.changeset.submit({
      summary: 'Change title again',
      changes: [
        {
          op: 'update',
          entityKind: 'anime',
          entityId: anime.id,
          baseRev: 2,
          payload: { titleEnglish: 'Mine' },
        },
      ],
      supersedesId: submitted.id,
    })
    const approved = await admin.client.changeset.approve({
      id: resubmitted.id,
    })
    expect(approved.status).toBe('approved')
    expect((await user.client.anime.get({ id: anime.id })).titleEnglish).toBe(
      'Mine',
    )
  })

  it('reports slug and genre conflicts that appeared after submission', async () => {
    const genre = await admin.client.genre.create({ name: 'Doomed' })
    const animeId = randomUUID()
    const submitted = await user.client.changeset.submit({
      summary: 'Will conflict',
      changes: [
        {
          op: 'create',
          entityKind: 'anime',
          entityId: animeId,
          payload: { slug: 'race-slug', genreIds: [genre.id], media: [] },
        },
      ],
    })
    await admin.client.anime.create({ slug: 'race-slug' })
    await admin.client.genre.remove({ id: genre.id })

    const blocked = await admin.client.changeset.approve({ id: submitted.id })
    expect(blocked.status).toBe('pending')
    const body = blocked.messages.at(-1)?.body ?? ''
    expect(body).toContain('Slug "race-slug" is already taken')
    expect(body).toMatch(/genre/i)
    const missing = await errorOf(user.client.anime.get({ id: animeId }))
    expect(missing?.code).toBe('NOT_FOUND')
  })

  it('lets exactly one of two concurrent approvals win', async () => {
    const submitted = await user.client.changeset.submit({
      summary: 'Race',
      changes: [animeCreate(randomUUID(), 'race-approve')],
    })
    const results = await Promise.allSettled([
      admin.client.changeset.approve({ id: submitted.id }),
      admin.client.changeset.approve({ id: submitted.id }),
    ])
    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
      code: 'CONFLICT',
    })
    const revisions = await app.db
      .select()
      .from(schema.entityRevision)
      .where(eq(schema.entityRevision.entityId, submitted.changes[0]!.entityId))
    expect(revisions).toHaveLength(1)
  })

  it('rejects with a reason and refuses later decisions', async () => {
    const submitted = await user.client.changeset.submit({
      summary: 'To reject',
      changes: [animeCreate(randomUUID(), 'rejected-anime')],
    })
    const rejected = await admin.client.changeset.reject({
      id: submitted.id,
      reason: 'Not enough detail',
    })
    expect(rejected).toMatchObject({
      status: 'rejected',
      decidedBy: { id: adminId },
    })
    expect(rejected.messages.at(-1)).toMatchObject({
      kind: 'rejection',
      body: 'Not enough detail',
      author: { id: adminId },
    })
    const missing = await errorOf(animeBySlug(user.client, 'rejected-anime'))
    expect(missing?.code).toBe('NOT_FOUND')
    const approve = await errorOf(
      admin.client.changeset.approve({ id: submitted.id }),
    )
    expect(approve?.code).toBe('CONFLICT')
    const withdraw = await errorOf(
      user.client.changeset.withdraw({ id: submitted.id }),
    )
    expect(withdraw?.code).toBe('CONFLICT')
  })

  it('reverts an approved changeset by inverting its changes in reverse order', async () => {
    const existing = await admin.client.anime.create({
      slug: 'revert-target',
      titleEnglish: 'Original',
    })
    const createdId = randomUUID()
    const submitted = await user.client.changeset.submit({
      summary: 'Create and edit',
      changes: [
        animeCreate(createdId, 'revert-created'),
        {
          op: 'update',
          entityKind: 'anime',
          entityId: existing.id,
          baseRev: 1,
          payload: { titleEnglish: 'Edited' },
        },
      ],
    })
    await admin.client.changeset.approve({ id: submitted.id })
    expect(
      (await user.client.anime.get({ id: existing.id })).titleEnglish,
    ).toBe('Edited')

    const reverted = await admin.client.changeset.revert({ id: submitted.id })
    expect(reverted).toMatchObject({
      status: 'approved',
      revertsId: submitted.id,
      author: { id: adminId },
    })
    expect(reverted.changes.map((c) => [c.entityId, c.op])).toEqual([
      [existing.id, 'update'],
      [createdId, 'delete'],
    ])
    expect(
      (await user.client.anime.get({ id: existing.id })).titleEnglish,
    ).toBe('Original')
    const gone = await errorOf(user.client.anime.get({ id: createdId }))
    expect(gone?.code).toBe('NOT_FOUND')

    const original = await admin.client.changeset.get({ id: submitted.id })
    expect(original.revertedBy).toMatchObject({
      changesetId: reverted.id,
      actor: { id: adminId },
    })
    const twice = await admin.client.changeset.revert({ id: submitted.id })
    expect(twice.status).toBe('approved')
    expect(
      (await user.client.anime.get({ id: existing.id })).titleEnglish,
    ).toBe('Original')

    const undoRevert = await admin.client.changeset.revert({ id: reverted.id })
    expect(undoRevert.status).toBe('approved')
    expect(
      (await user.client.anime.get({ id: existing.id })).titleEnglish,
    ).toBe('Edited')
    expect(
      (await user.client.anime.get({ id: createdId })).deletedAt,
    ).toBeNull()
  })

  it('reverts an entity to an earlier revision, including undeleting it', async () => {
    const anime = await admin.client.anime.create({
      slug: 'time-travel',
      titleEnglish: 'One',
    })
    await admin.client.anime.update({ id: anime.id, titleEnglish: 'Two' })
    await admin.client.anime.update({ id: anime.id, titleEnglish: 'Three' })
    const history = await admin.client.revision.list({
      entityKind: 'anime',
      entityId: anime.id,
    })
    expect(history.items.map((r) => r.rev)).toEqual([3, 2, 1])
    const revOne = history.items.find((r) => r.rev === 1)!

    const detail = await admin.client.revision.get({ id: revOne.id })
    expect(detail).toMatchObject({
      rev: 1,
      snapshot: { titleEnglish: 'One' },
      previousSnapshot: null,
    })

    const back = await admin.client.revision.revert({ id: revOne.id })
    expect(back.status).toBe('approved')
    expect(await user.client.anime.get({ id: anime.id })).toMatchObject({
      titleEnglish: 'One',
      headRev: 4,
    })

    await admin.client.anime.remove({ id: anime.id })
    const deleted = await admin.client.revision.list({
      entityKind: 'anime',
      entityId: anime.id,
    })
    expect(deleted.items[0]).toMatchObject({ rev: 5, op: 'delete' })
    const restored = await admin.client.revision.revert({ id: revOne.id })
    expect(restored.changes[0]).toMatchObject({
      op: 'create',
      entityId: anime.id,
    })
    expect((await animeBySlug(user.client, 'time-travel')).deletedAt).toBeNull()
    const deleteAgain = await admin.client.revision.revert({
      id: deleted.items[0]!.id,
    })
    expect(deleteAgain.status).toBe('approved')
    const gone = await errorOf(animeBySlug(user.client, 'time-travel'))
    expect(gone?.code).toBe('NOT_FOUND')
  })

  it('blocks deleting a genre through a changeset while anime use it, unless the same changeset deletes them', async () => {
    const genre = await admin.client.genre.create({ name: 'Linked' })
    const anime = await admin.client.anime.create({
      slug: 'linked-anime',
      genreIds: [genre.id],
    })
    const blocked = await errorOf(
      user.client.changeset.submit({
        summary: 'Delete linked genre',
        changes: [
          { op: 'delete', entityKind: 'genre', entityId: genre.id, baseRev: 1 },
        ],
      }),
    )
    expect(blocked?.code).toBe('CONFLICT')

    const combined = await user.client.changeset.submit({
      summary: 'Delete anime then genre',
      changes: [
        { op: 'delete', entityKind: 'genre', entityId: genre.id, baseRev: 1 },
        { op: 'delete', entityKind: 'anime', entityId: anime.id, baseRev: 1 },
      ],
    })
    expect(combined.changes.map((c) => [c.entityKind, c.op])).toEqual([
      ['anime', 'delete'],
      ['genre', 'delete'],
    ])
    const approved = await admin.client.changeset.approve({ id: combined.id })
    expect(approved.status).toBe('approved')
    expect(
      (await user.client.genre.list({})).items.map((g) => g.id),
    ).not.toContain(genre.id)
    const gone = await errorOf(user.client.anime.get({ id: anime.id }))
    expect(gone?.code).toBe('NOT_FOUND')
  })
})
