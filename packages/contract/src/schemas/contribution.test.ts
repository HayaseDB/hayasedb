import { describe, expect, it } from 'vitest'
import {
  changeInputSchema,
  listChangesetsInputSchema,
  submitChangesetInputSchema,
} from './contribution'

const id = '0195a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'

describe('changeInputSchema', () => {
  it('accepts a genre create with a genre document', () => {
    expect(
      changeInputSchema.safeParse({
        op: 'create',
        entityKind: 'genre',
        entityId: id,
        payload: { name: 'Action' },
      }).success,
    ).toBe(true)
  })

  it('rejects a genre create carrying an anime document', () => {
    expect(
      changeInputSchema.safeParse({
        op: 'create',
        entityKind: 'genre',
        entityId: id,
        payload: { slug: 'bebop', genreIds: [], media: [] },
      }).success,
    ).toBe(false)
  })

  it('accepts an anime create with the full document', () => {
    expect(
      changeInputSchema.safeParse({
        op: 'create',
        entityKind: 'anime',
        entityId: id,
        payload: { slug: 'bebop', genreIds: [], media: [] },
      }).success,
    ).toBe(true)
  })

  it('requires baseRev on update and delete', () => {
    expect(
      changeInputSchema.safeParse({
        op: 'update',
        entityKind: 'genre',
        entityId: id,
        payload: { name: 'Drama' },
      }).success,
    ).toBe(false)
    expect(
      changeInputSchema.safeParse({
        op: 'delete',
        entityKind: 'genre',
        entityId: id,
        baseRev: 0,
      }).success,
    ).toBe(false)
    expect(
      changeInputSchema.safeParse({
        op: 'delete',
        entityKind: 'genre',
        entityId: id,
        baseRev: 1,
      }).success,
    ).toBe(true)
  })

  it('rejects an empty update patch', () => {
    const result = changeInputSchema.safeParse({
      op: 'update',
      entityKind: 'anime',
      entityId: id,
      baseRev: 1,
      payload: {},
    })
    expect(result.success).toBe(false)
  })

  it('rejects unknown kinds and ops', () => {
    expect(
      changeInputSchema.safeParse({
        op: 'create',
        entityKind: 'studio',
        entityId: id,
      }).success,
    ).toBe(false)
    expect(
      changeInputSchema.safeParse({
        op: 'merge',
        entityKind: 'genre',
        entityId: id,
      }).success,
    ).toBe(false)
  })
})

describe('submitChangesetInputSchema', () => {
  const change = {
    op: 'create',
    entityKind: 'genre',
    entityId: id,
    payload: { name: 'Action' },
  }

  it('needs a summary and at least one change', () => {
    expect(
      submitChangesetInputSchema.safeParse({ summary: 'ok', changes: [change] })
        .success,
    ).toBe(false)
    expect(
      submitChangesetInputSchema.safeParse({
        summary: 'Add genre',
        changes: [],
      }).success,
    ).toBe(false)
    expect(
      submitChangesetInputSchema.safeParse({
        summary: 'Add genre',
        changes: [change],
      }).success,
    ).toBe(true)
  })

  it('caps at 20 changes', () => {
    expect(
      submitChangesetInputSchema.safeParse({
        summary: 'Add genres',
        changes: Array.from({ length: 21 }, () => change),
      }).success,
    ).toBe(false)
  })
})

describe('listChangesetsInputSchema', () => {
  it('coerces mine from query strings', () => {
    expect(listChangesetsInputSchema.parse({ mine: 'true' }).mine).toBe(true)
    expect(listChangesetsInputSchema.parse({ mine: 'false' }).mine).toBe(false)
    expect(listChangesetsInputSchema.parse({}).mine).toBeUndefined()
  })
})
