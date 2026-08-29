import { describe, expect, it } from 'vitest'
import {
  applyPayloadToState,
  applyRelationPayloadToState,
  buildAnimeFormState,
  isPayloadRelationList,
  relationEdgeKey,
} from './animeForm'
import { UUID } from '../../test/contribution-fixtures'

const A = UUID(1)
const B = UUID(2)
const C = UUID(3)

describe('buildAnimeFormState', () => {
  it('starts empty with the meta-defined empty values', () => {
    expect(buildAnimeFormState()).toEqual({
      slug: '',
      format: null,
      status: null,
      translations: [
        { locale: 'en', title: '', description: null, original: true },
      ],
      startDate: null,
      endDate: null,
      genreIds: [],
      relationEdges: [],
    })
  })

  it('maps a detail into form state, replacing nulls and flattening genres and relations', () => {
    const state = buildAnimeFormState({
      slug: 'bebop',
      format: 'TV',
      status: null,
      translations: [
        { locale: 'en', title: 'Bebop', description: null, original: true },
      ],
      startDate: { year: 1998, month: 4, day: 3 },
      endDate: null,
      genres: [
        {
          id: 'g1',
          slug: 'action',
          name: 'Action',
          locale: 'en',
          translations: [{ locale: 'en', name: 'Action' }],
        },
      ],
      relations: [
        {
          kind: 'SEQUEL',
          owned: true,
          anime: {
            id: B,
            slug: 'b',
            format: null,
            status: null,
            title: { locale: 'en', title: 'Bee', original: true },
            startYear: null,
            coverUrl: null,
            coverBlurhash: null,
          },
        },
      ],
    })
    expect(state).toMatchObject({
      slug: 'bebop',
      format: 'TV',
      status: null,
      translations: [
        { locale: 'en', title: 'Bebop', description: null, original: true },
      ],
      startDate: { year: 1998, month: 4, day: 3 },
      genreIds: ['g1'],
      relationEdges: [{ animeId: B, title: 'Bee', kind: 'SEQUEL' }],
    })
  })
})

describe('applyPayloadToState', () => {
  it('only touches fields present in the payload and coerces by field meta', () => {
    const state = buildAnimeFormState()
    state.translations[0]!.title = 'keep'
    applyPayloadToState(state, {
      slug: 42,
      genreIds: ['g1', 7, null],
      startDate: '2001-02-03',
      endDate: { year: 2002, month: null, day: null },
      format: undefined,
      status: 'FINISHED',
      media: [{ type: 'COVER' }],
    })
    expect(state).toMatchObject({
      translations: [
        { locale: 'en', title: 'keep', description: null, original: true },
      ],
      slug: '',
      genreIds: ['g1'],
      startDate: { year: 2001, month: 2, day: 3 },
      endDate: { year: 2002, month: null, day: null },
      format: null,
      status: 'FINISHED',
    })
    expect(state).not.toHaveProperty('media')

    applyPayloadToState(state, { startDate: 'not-a-date', genreIds: 'g1' })
    expect(state.startDate).toBeNull()
    expect(state.genreIds).toEqual([])
  })

  it('restores localized translations, which are objects rather than ids', () => {
    const state = buildAnimeFormState()
    applyPayloadToState(state, {
      translations: [
        { locale: 'en', title: 'Star', description: 'A show', original: true },
        { locale: 'de', title: 'Stern', description: null, original: false },
      ],
    })
    expect(state.translations).toEqual([
      { locale: 'en', title: 'Star', description: 'A show', original: true },
      { locale: 'de', title: 'Stern', description: null, original: false },
    ])
  })
})

describe('relation payload helpers', () => {
  it('recognises well-formed relation lists only', () => {
    expect(isPayloadRelationList([])).toBe(true)
    expect(isPayloadRelationList([{ targetId: B, kind: 'SEQUEL' }])).toBe(true)
    expect(isPayloadRelationList([{ targetId: B }])).toBe(false)
    expect(isPayloadRelationList([null])).toBe(false)
    expect(isPayloadRelationList({ targetId: B, kind: 'SEQUEL' })).toBe(false)
  })

  it('keys edges by target and view kind', () => {
    expect(relationEdgeKey({ animeId: B, title: 'x', kind: 'PREQUEL' })).toBe(
      `${B}:PREQUEL`,
    )
  })

  it('replaces only the edges owned by the payload owner, seen from the viewer side', () => {
    const state = buildAnimeFormState()
    state.relationEdges = [
      { animeId: B, title: 'B', kind: 'SEQUEL' },
      { animeId: C, title: 'C', kind: 'PREQUEL' },
    ]
    applyRelationPayloadToState(
      state,
      A,
      A,
      [{ targetId: C, kind: 'ALTERNATIVE' }],
      (id) => (id === C ? 'See' : undefined),
    )
    expect(state.relationEdges).toEqual([
      { animeId: C, title: 'C', kind: 'PREQUEL' },
      { animeId: C, title: 'See', kind: 'ALTERNATIVE' },
    ])
  })

  it('inverts kinds when the owner is the other anime and drops edges aimed elsewhere', () => {
    const state = buildAnimeFormState()
    state.relationEdges = [
      { animeId: B, title: 'B', kind: 'SEQUEL' },
      { animeId: C, title: 'C', kind: 'PREQUEL' },
    ]
    applyRelationPayloadToState(
      state,
      C,
      A,
      [
        { targetId: A, kind: 'SIDE_STORY' },
        { targetId: B, kind: 'SEQUEL' },
      ],
      () => 'Cee',
    )
    expect(state.relationEdges).toEqual([
      { animeId: B, title: 'B', kind: 'SEQUEL' },
      { animeId: C, title: 'Cee', kind: 'PARENT_STORY' },
    ])
  })
})
