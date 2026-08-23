import { describe, expect, it } from 'vitest'
import { fc, test } from '@fast-check/vitest'
import {
  ANIME_RELATION_INVERSE,
  ANIME_RELATION_KINDS,
  ANIME_RELATION_VIEW_KINDS,
  canonicalizeRelation,
  groupRelationsByOwner,
  isSymmetricRelation,
  relationViewKind,
} from './relation'

const id = fc.uuid()
const viewKind = fc.constantFrom(...ANIME_RELATION_VIEW_KINDS)
const distinctIds = fc.tuple(id, id).filter(([a, b]) => a !== b)

describe('canonicalizeRelation', () => {
  it('throws on a self relation', () => {
    expect(() => canonicalizeRelation('a', 'a', 'SEQUEL')).toThrow(
      'An anime cannot relate to itself',
    )
  })

  it('keeps a direct kind owned by self', () => {
    expect(canonicalizeRelation('a', 'b', 'SEQUEL')).toEqual({
      sourceId: 'a',
      targetId: 'b',
      kind: 'SEQUEL',
    })
  })

  it('flips an inverse view kind so the other anime owns the edge', () => {
    expect(canonicalizeRelation('a', 'b', 'PREQUEL')).toEqual({
      sourceId: 'b',
      targetId: 'a',
      kind: 'SEQUEL',
    })
    expect(canonicalizeRelation('a', 'b', 'PARENT_STORY')).toEqual({
      sourceId: 'b',
      targetId: 'a',
      kind: 'SIDE_STORY',
    })
    expect(canonicalizeRelation('a', 'b', 'SPIN_OFF_ORIGIN').kind).toBe(
      'SPIN_OFF',
    )
    expect(canonicalizeRelation('a', 'b', 'FULL_STORY').kind).toBe('SUMMARY')
  })

  it('orders symmetric kinds by id regardless of viewer', () => {
    const fromA = canonicalizeRelation('a', 'b', 'ALTERNATIVE')
    const fromB = canonicalizeRelation('b', 'a', 'ALTERNATIVE')
    expect(fromA).toEqual({ sourceId: 'a', targetId: 'b', kind: 'ALTERNATIVE' })
    expect(fromB).toEqual(fromA)
  })

  test.prop([distinctIds, viewKind])(
    'produces the same edge from either endpoint',
    ([self, other], view) => {
      const edge = canonicalizeRelation(self, other, view)
      const viewerIsSource = edge.sourceId === self
      const mirrored = canonicalizeRelation(
        other,
        self,
        relationViewKind(edge.kind, !viewerIsSource),
      )
      expect(mirrored).toEqual(edge)
    },
  )

  test.prop([distinctIds, viewKind])(
    'always yields a base kind and both ids',
    ([self, other], view) => {
      const edge = canonicalizeRelation(self, other, view)
      expect(ANIME_RELATION_KINDS).toContain(edge.kind)
      expect(new Set([edge.sourceId, edge.targetId])).toEqual(
        new Set([self, other]),
      )
    },
  )
})

describe('relationViewKind', () => {
  it('returns the inverse for the target side', () => {
    for (const kind of ANIME_RELATION_KINDS) {
      expect(relationViewKind(kind, true)).toBe(kind)
      expect(relationViewKind(kind, false)).toBe(ANIME_RELATION_INVERSE[kind])
    }
  })

  it('is its own inverse for symmetric kinds', () => {
    for (const kind of ANIME_RELATION_KINDS) {
      expect(ANIME_RELATION_INVERSE[kind] === kind).toBe(
        isSymmetricRelation(kind),
      )
    }
  })
})

describe('groupRelationsByOwner', () => {
  it('partitions edges by canonical owner', () => {
    const groups = groupRelationsByOwner('a', [
      { animeId: 'b', kind: 'SEQUEL' },
      { animeId: 'c', kind: 'PREQUEL' },
      { animeId: 'd', kind: 'ALTERNATIVE' },
    ])
    expect([...groups.keys()].sort()).toEqual(['a', 'c'])
    expect(groups.get('a')).toEqual([
      { sourceId: 'a', targetId: 'b', kind: 'SEQUEL' },
      { sourceId: 'a', targetId: 'd', kind: 'ALTERNATIVE' },
    ])
    expect(groups.get('c')).toEqual([
      { sourceId: 'c', targetId: 'a', kind: 'SEQUEL' },
    ])
  })

  test.prop([
    id,
    fc.array(fc.record({ animeId: id, kind: viewKind }), { maxLength: 20 }),
  ])('keeps every edge exactly once', (self, edges) => {
    const valid = edges.filter((edge) => edge.animeId !== self)
    const groups = groupRelationsByOwner(self, valid)
    const total = [...groups.values()].reduce((n, list) => n + list.length, 0)
    expect(total).toBe(valid.length)
    for (const [owner, list] of groups) {
      expect(list.every((edge) => edge.sourceId === owner)).toBe(true)
    }
  })
})
