import { describe, expect, it } from 'vitest'
import { collectDocumentRefs, diffDocuments, pickDocumentKeys } from './diff'

describe('diffDocuments', () => {
  it('treats every key as changed when there is no previous document', () => {
    expect(diffDocuments(null, { a: 1, b: null })).toEqual(['a', 'b'])
  })

  it('returns only keys whose value differs structurally', () => {
    const prev = { slug: 'a', genreIds: ['x', 'y'], media: [{ p: 1, q: 2 }] }
    const next = { slug: 'b', genreIds: ['x', 'y'], media: [{ q: 2, p: 1 }] }
    expect(diffDocuments(prev, next)).toEqual(['slug'])
  })

  it('reports keys that were added or removed', () => {
    expect(diffDocuments({ a: 1 }, { b: 1 }).sort()).toEqual(['a', 'b'])
  })

  it('treats a missing value and null as equal, as the stored snapshot does', () => {
    expect(diffDocuments({ a: undefined }, { a: null })).toEqual([])
    expect(diffDocuments({ a: null }, { a: null })).toEqual([])
  })

  it('is sensitive to array order', () => {
    expect(diffDocuments({ a: [1, 2] }, { a: [2, 1] })).toEqual(['a'])
  })
})

describe('pickDocumentKeys', () => {
  it('keeps only present keys, including ones holding null', () => {
    expect(
      pickDocumentKeys({ a: 1, b: null, c: 3 }, ['a', 'b', 'missing']),
    ).toEqual({ a: 1, b: null })
  })
})

describe('collectDocumentRefs', () => {
  it('collects ids per target, deduplicated across documents', () => {
    const refs = collectDocumentRefs([
      {
        kind: 'anime',
        doc: {
          genreIds: ['g1', 'g2', 'g1'],
          relations: [{ targetId: 'a2', kind: 'SEQUEL' }],
          media: [{ mediaId: 'm1' }, { mediaId: 'm1' }, { type: 'COVER' }],
        },
      },
      {
        kind: 'anime',
        doc: { genreIds: ['g2', 'g3'], relations: [], media: [] },
      },
      { kind: 'genre', doc: { name: 'Action' } },
    ])
    expect(refs).toEqual({
      genre: ['g1', 'g2', 'g3'],
      anime: ['a2'],
      mediaAsset: ['m1'],
    })
  })

  it('ignores malformed documents and non-string ids', () => {
    const refs = collectDocumentRefs([
      { kind: 'anime', doc: null },
      { kind: 'anime', doc: 'nope' },
      {
        kind: 'anime',
        doc: { genreIds: [1, null], relations: 'x', media: [null, 5] },
      },
    ])
    expect(refs).toEqual({ genre: [], mediaAsset: [] })
  })
})
