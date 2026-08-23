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

describe('genres', () => {
  let app: TestApp
  let admin: TestHttp
  let anon: TestHttp

  beforeAll(async () => {
    app = await createTestApp()
    admin = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
    await signUpAdmin(admin, app.mailer, app.db)
    anon = createTestHttp(app.baseUrl, { internalToken: INTERNAL_TOKEN })
  })

  afterAll(async () => {
    await app.close()
  })

  it('treats names as case-insensitively unique on create and rename', async () => {
    const comedy = await admin.client.genre.create({ name: '  Comedy ' })
    expect(comedy.name).toBe('Comedy')
    const dup = await errorOf(admin.client.genre.create({ name: 'comedy' }))
    expect(dup?.code).toBe('CONFLICT')

    const horror = await admin.client.genre.create({ name: 'Horror' })
    const rename = await errorOf(
      admin.client.genre.update({ id: horror.id, name: 'COMEDY' }),
    )
    expect(rename?.code).toBe('CONFLICT')
    const recase = await admin.client.genre.update({
      id: comedy.id,
      name: 'COMEDY',
    })
    expect(recase.name).toBe('COMEDY')
  })

  it('counts only live anime per genre in the public list', async () => {
    const mecha = await admin.client.genre.create({ name: 'Mecha' })
    const a = await admin.client.anime.create({
      slug: 'mecha-a',
      genreIds: [mecha.id],
    })
    await admin.client.anime.create({ slug: 'mecha-b', genreIds: [mecha.id] })
    const before = (await anon.client.genre.list()).items.find(
      (g) => g.id === mecha.id,
    )
    expect(before?.animeCount).toBe(2)

    await admin.client.anime.remove({ id: a.id })
    const after = (await anon.client.genre.list()).items.find(
      (g) => g.id === mecha.id,
    )
    expect(after?.animeCount).toBe(1)
  })

  it('blocks deleting a used genre, allows it once unlinked, and keeps the name reserved after soft delete', async () => {
    const sports = await admin.client.genre.create({ name: 'Sports' })
    const anime = await admin.client.anime.create({
      slug: 'sports-a',
      genreIds: [sports.id],
    })
    const blocked = await errorOf(admin.client.genre.remove({ id: sports.id }))
    expect(blocked?.code).toBe('CONFLICT')

    await admin.client.anime.update({ id: anime.id, genreIds: [] })
    expect(await admin.client.genre.remove({ id: sports.id })).toEqual({
      success: true,
    })
    expect(
      (await anon.client.genre.list()).items.map((g) => g.id),
    ).not.toContain(sports.id)

    const again = await errorOf(admin.client.genre.remove({ id: sports.id }))
    expect(again?.code).toBe('NOT_FOUND')
    const reuse = await errorOf(admin.client.genre.create({ name: 'Sports' }))
    expect(reuse?.code).toBe('CONFLICT')
  })

  it('forbids genre writes for anonymous callers', async () => {
    const error = await errorOf(anon.client.genre.create({ name: 'Nope' }))
    expect(error?.code).toBe('UNAUTHORIZED')
  })
})
