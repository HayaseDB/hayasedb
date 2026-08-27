import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnimeRelationPlan } from '#imports'
import type { AnimeRelationViewEdge } from '@hayasedb/domain'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

mockNuxtImport('useApiClient', () => () => ({ anime: { get } }))

const SELF = '00000000-0000-7000-8000-00000000000a'
const B = '00000000-0000-7000-8000-00000000000b'
const C = '00000000-0000-7000-8000-00000000000c'

type Remote = {
  headRev: number
  relations: Array<{ owned: boolean; kind: string; anime: { id: string } }>
}
const remote = new Map<string, Remote>()

const edge = (
  animeId: string,
  kind: AnimeRelationViewEdge['kind'],
): AnimeRelationViewEdge => ({ animeId, kind })

beforeEach(() => {
  remote.clear()
  get.mockReset()
  get.mockImplementation(async ({ id }: { id: string }) => {
    const found = remote.get(id)
    if (!found) throw new Error(`unknown ${id}`)
    return found
  })
})

describe('useAnimeRelationPlan', () => {
  it('reports own relations sorted and unchanged when the edges equal the baseline', async () => {
    const edges = [edge(C, 'SEQUEL'), edge(B, 'SEQUEL')]
    const { plan } = useAnimeRelationPlan()
    const result = await plan(SELF, { edges, baseline: [...edges].reverse() })
    expect(result.own).toEqual([
      { targetId: B, kind: 'SEQUEL' },
      { targetId: C, kind: 'SEQUEL' },
    ])
    expect(result.ownChanged).toBe(false)
    expect(result.foreign).toEqual([])
    expect(get).not.toHaveBeenCalled()
  })

  it('an inverse kind is stored on the other anime with the canonical kind', async () => {
    remote.set(B, { headRev: 4, relations: [] })
    const { plan } = useAnimeRelationPlan()
    const result = await plan(SELF, {
      edges: [edge(B, 'PREQUEL')],
      baseline: [],
    })
    expect(result.own).toEqual([])
    expect(result.ownChanged).toBe(false)
    expect(result.foreign).toEqual([
      {
        animeId: B,
        headRev: 4,
        relations: [{ targetId: SELF, kind: 'SEQUEL' }],
      },
    ])
  })

  it("removing a foreign-owned edge keeps the owner's other relations intact", async () => {
    remote.set(B, {
      headRev: 9,
      relations: [
        { owned: true, kind: 'SEQUEL', anime: { id: SELF } },
        { owned: true, kind: 'SIDE_STORY', anime: { id: C } },
        { owned: false, kind: 'PARENT_STORY', anime: { id: C } },
      ],
    })
    const { plan } = useAnimeRelationPlan()
    const result = await plan(SELF, {
      edges: [],
      baseline: [edge(B, 'PREQUEL')],
    })
    expect(result.foreign).toEqual([
      {
        animeId: B,
        headRev: 9,
        relations: [{ targetId: C, kind: 'SIDE_STORY' }],
      },
    ])
  })

  it('skips a foreign owner whose stored relations already match', async () => {
    remote.set(B, {
      headRev: 2,
      relations: [{ owned: true, kind: 'SEQUEL', anime: { id: SELF } }],
    })
    const { plan } = useAnimeRelationPlan()
    const result = await plan(SELF, {
      edges: [edge(B, 'PREQUEL')],
      baseline: [],
    })
    expect(result.foreign).toEqual([])
  })

  it('flags own changes when a canonical relation is added and fetches each foreign owner once', async () => {
    remote.set(B, { headRev: 1, relations: [] })
    const { plan } = useAnimeRelationPlan()
    const result = await plan(SELF, {
      edges: [edge(C, 'SEQUEL'), edge(B, 'PREQUEL'), edge(B, 'PARENT_STORY')],
      baseline: [edge(C, 'SEQUEL')],
    })
    expect(result.own).toEqual([{ targetId: C, kind: 'SEQUEL' }])
    expect(result.ownChanged).toBe(false)
    expect(get).toHaveBeenCalledTimes(1)
    expect(result.foreign[0]?.relations).toEqual([
      { targetId: SELF, kind: 'SEQUEL' },
      { targetId: SELF, kind: 'SIDE_STORY' },
    ])
  })
})
