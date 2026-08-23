import type { EntityKind } from '@hayasedb/domain'
import { describe, expect, it, vi } from 'vitest'
import type { Tx } from './types'
import { animeHandler, normalizedMedia } from './anime.handler'

const untouchedTx = new Proxy({} as Tx, {
  get(_target, prop) {
    throw new Error(`unexpected database access: ${String(prop)}`)
  },
})

describe('normalizedMedia', () => {
  it('renumbers positions per type and orders types COVER, BANNER, GALLERY', () => {
    expect(
      normalizedMedia([
        { mediaId: 'g2', type: 'GALLERY', position: 7 },
        { mediaId: 'b1', type: 'BANNER', position: 3 },
        { mediaId: 'g1', type: 'GALLERY', position: 2 },
        { mediaId: 'c1', type: 'COVER', position: 9 },
      ]),
    ).toEqual([
      { mediaId: 'c1', type: 'COVER', position: 0 },
      { mediaId: 'b1', type: 'BANNER', position: 0 },
      { mediaId: 'g1', type: 'GALLERY', position: 0 },
      { mediaId: 'g2', type: 'GALLERY', position: 1 },
    ])
  })

  it('keeps the relative order of equal positions stable', () => {
    const out = normalizedMedia([
      { mediaId: 'a', type: 'GALLERY', position: 1 },
      { mediaId: 'b', type: 'GALLERY', position: 1 },
    ])
    expect(out.map((m) => m.mediaId)).toEqual(['a', 'b'])
  })
})

describe('animeHandler.validateRefs', () => {
  const self = '00000000-0000-7000-8000-000000000010'
  const lower = '00000000-0000-7000-8000-000000000001'
  const higher = '00000000-0000-7000-8000-000000000020'

  it('rejects a self relation without touching the database', async () => {
    const problems = await animeHandler.validateRefs(
      untouchedTx,
      { relations: [{ targetId: self, kind: 'SEQUEL' }] },
      new Map<string, EntityKind>([[self, 'anime']]),
      self,
    )
    expect(problems).toEqual(['An anime cannot relate to itself'])
  })

  it('requires symmetric relations to live on the lower id', async () => {
    const siblings = new Map<string, EntityKind>([
      [lower, 'anime'],
      [higher, 'anime'],
    ])
    expect(
      await animeHandler.validateRefs(
        untouchedTx,
        { relations: [{ targetId: lower, kind: 'ALTERNATIVE' }] },
        siblings,
        self,
      ),
    ).toEqual(['Symmetric relations must be stored on the lower anime id'])
    expect(
      await animeHandler.validateRefs(
        untouchedTx,
        { relations: [{ targetId: higher, kind: 'ALTERNATIVE' }] },
        siblings,
        self,
      ),
    ).toEqual([])
    expect(
      await animeHandler.validateRefs(
        untouchedTx,
        { relations: [{ targetId: lower, kind: 'SEQUEL' }] },
        siblings,
        self,
      ),
    ).toEqual([])
  })

  it('skips lookups for references created in the same changeset', async () => {
    const problems = await animeHandler.validateRefs(
      untouchedTx,
      {
        relations: [{ targetId: higher, kind: 'SEQUEL' }],
        genreIds: ['g1', 'g1'],
        media: [],
      },
      new Map<string, EntityKind>([
        [higher, 'anime'],
        ['g1', 'genre'],
      ]),
      self,
    )
    expect(problems).toEqual([])
  })

  it('reports each missing reference kind once', async () => {
    const select = vi.fn(() => ({
      from: () => ({
        innerJoin: () => ({ where: async () => [] }),
        where: async () => [],
      }),
    }))
    const tx = { select } as unknown as Tx
    const problems = await animeHandler.validateRefs(
      tx,
      {
        relations: [
          { targetId: higher, kind: 'SEQUEL' },
          { targetId: higher, kind: 'SIDE_STORY' },
        ],
        genreIds: ['g1', 'g2'],
        media: [{ mediaId: 'm1' }, { mediaId: 'm1' }],
      },
      new Map(),
      self,
    )
    expect(problems).toEqual([
      'One or more related anime do not exist',
      'One or more referenced genres do not exist',
      'One or more referenced media uploads do not exist',
    ])
    expect(select).toHaveBeenCalledTimes(3)
  })
})
