import { type EffectScope, effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  stagedFingerprint,
  useMediaStaging,
  useStagedMedia,
  type StagedExistingItem,
} from '#imports'

let scope: EffectScope
const inScope = <T>(fn: () => T): T => scope.run(fn) as T

const file = (name: string) => new File(['x'], name, { type: 'image/png' })
const existing = (id: string): StagedExistingItem => ({
  key: id,
  kind: 'existing',
  id,
  url: `https://cdn/${id}.webp`,
})

let objectUrlSeq = 0
let revokeObjectURL: ReturnType<typeof vi.fn>

beforeEach(() => {
  scope = effectScope()
  objectUrlSeq = 0
  vi.spyOn(URL, 'createObjectURL').mockImplementation(
    () => `blob:${++objectUrlSeq}`,
  )
  revokeObjectURL = vi
    .spyOn(URL, 'revokeObjectURL')
    .mockImplementation(() => {})
})

afterEach(() => {
  scope.stop()
  vi.restoreAllMocks()
})

describe('useMediaStaging', () => {
  const initial = () => ({
    cover: existing('c1'),
    banner: null,
    gallery: [existing('g1'), existing('g2')],
  })

  it('starts clean and becomes dirty on any staged change', () => {
    const staging = inScope(() => useMediaStaging(initial))
    expect(staging.isDirty.value).toBe(false)
    staging.setSingle('BANNER', file('b.png'))
    expect(staging.isDirty.value).toBe(true)
    staging.removeSingle('BANNER')
    expect(staging.isDirty.value).toBe(false)
  })

  it('replacing a pending single revokes its object url, existing items are never revoked', () => {
    const staging = inScope(() => useMediaStaging(initial))
    staging.setSingle('COVER', file('a.png'))
    expect(revokeObjectURL).not.toHaveBeenCalled()
    staging.setSingle('COVER', file('b.png'))
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1')
    staging.removeSingle('COVER')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:2')
    expect(staging.cover.value).toBeNull()
  })

  it('gallery add, remove and reorder keep keys unique and stable', () => {
    const staging = inScope(() => useMediaStaging(initial))
    staging.addGallery(file('n1.png'))
    staging.addGallery(file('n2.png'))
    expect(stagedFingerprint(staging.gallery.value)).toEqual([
      'g1',
      'g2',
      'pending-1',
      'pending-2',
    ])
    staging.reorderGallery(3, 0)
    expect(stagedFingerprint(staging.gallery.value)).toEqual([
      'pending-2',
      'g1',
      'g2',
      'pending-1',
    ])
    staging.reorderGallery(1, 1)
    staging.reorderGallery(9, 0)
    expect(stagedFingerprint(staging.gallery.value)).toEqual([
      'pending-2',
      'g1',
      'g2',
      'pending-1',
    ])
    staging.removeGallery('pending-2')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:2')
    staging.removeGallery('g1')
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(stagedFingerprint(staging.gallery.value)).toEqual([
      'g2',
      'pending-1',
    ])
  })

  it('reorder alone marks dirty and sync restores the source state and revokes pending urls', () => {
    const staging = inScope(() => useMediaStaging(initial))
    staging.reorderGallery(0, 1)
    expect(staging.isDirty.value).toBe(true)
    staging.addGallery(file('n.png'))
    staging.sync()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:1')
    expect(staging.isDirty.value).toBe(false)
    expect(stagedFingerprint(staging.staged())).toEqual([
      'c1',
      null,
      'g1',
      'g2',
    ])
  })

  it('revokes every outstanding pending url when the scope is disposed', () => {
    const own = effectScope()
    own.run(() => {
      const staging = useMediaStaging(initial)
      staging.setSingle('COVER', file('a.png'))
      staging.addGallery(file('b.png'))
    })
    own.stop()
    expect(revokeObjectURL.mock.calls.map((c) => c[0]).sort()).toEqual([
      'blob:1',
      'blob:2',
    ])
  })
})

describe('useStagedMedia', () => {
  type Media = {
    id: string
    type: 'COVER' | 'BANNER' | 'GALLERY'
    position: number
    url: string
  }
  let media: Media[]
  const detail = () => ({ media: media.map((m) => ({ ...m })) })
  const calls: string[] = []
  let nextId = 100

  const api = {
    addMedia: vi.fn(
      async ({ type, file }: { type: Media['type']; file: File }) => {
        const id = `m${nextId++}`
        calls.push(`add:${type}:${file.name}`)
        media.push({
          id,
          type,
          position: media.filter((m) => m.type === type).length,
          url: `u/${id}`,
        })
        return detail()
      },
    ),
    removeMedia: vi.fn(async ({ id }: { id: string }) => {
      calls.push(`remove:${id}`)
      media = media.filter((m) => m.id !== id)
      return detail()
    }),
    reorderMedia: vi.fn(
      async ({
        type,
        orderedIds,
      }: {
        type: Media['type']
        orderedIds: string[]
      }) => {
        calls.push(`reorder:${type}:${orderedIds.join(',')}`)
        return detail()
      },
    ),
  }

  beforeEach(() => {
    calls.length = 0
    nextId = 100
    media = [
      { id: 'g2', type: 'GALLERY', position: 1, url: 'u/g2' },
      { id: 'c1', type: 'COVER', position: 0, url: 'u/c1' },
      { id: 'g1', type: 'GALLERY', position: 0, url: 'u/g1' },
    ]
  })

  it('maps the source detail into ordered slots', () => {
    const staged = inScope(() => useStagedMedia(detail, api))
    expect(
      staged.cover.value?.kind === 'existing' && staged.cover.value.id,
    ).toBe('c1')
    expect(staged.banner.value).toBeNull()
    expect(stagedFingerprint(staged.gallery.value)).toEqual(['g1', 'g2'])
  })

  it('commit is a no-op when nothing changed', async () => {
    const staged = inScope(() => useStagedMedia(detail, api))
    await staged.commit('a1')
    expect(calls).toEqual([])
  })

  it('commits cover before banner before gallery, removing a replaced single first', async () => {
    const staged = inScope(() => useStagedMedia(detail, api))
    staged.setSingle('COVER', file('cover.png'))
    staged.setSingle('BANNER', file('banner.png'))
    staged.addGallery(file('new.png'))
    await staged.commit('a1')
    expect(calls).toEqual([
      'remove:c1',
      'add:COVER:cover.png',
      'add:BANNER:banner.png',
      'add:GALLERY:new.png',
      'reorder:GALLERY:g1,g2,m102',
    ])
  })

  it('removing a single only issues a remove and clearing an empty slot issues nothing', async () => {
    const staged = inScope(() => useStagedMedia(detail, api))
    staged.removeSingle('COVER')
    staged.removeSingle('BANNER')
    await staged.commit('a1')
    expect(calls).toEqual(['remove:c1'])
  })

  it('gallery commit removes dropped items, then reorders the survivors because the length changed', async () => {
    const staged = inScope(() => useStagedMedia(detail, api))
    staged.removeGallery('g1')
    await staged.commit('a1')
    expect(calls).toEqual(['remove:g1', 'reorder:GALLERY:g2'])
  })

  it('a gallery reorder that ends in the original order issues no call', async () => {
    const staged = inScope(() => useStagedMedia(detail, api))
    staged.reorderGallery(0, 1)
    staged.reorderGallery(1, 0)
    expect(staged.isDirty.value).toBe(false)
    await staged.commit('a1')
    expect(calls).toEqual([])
  })

  it('a real gallery reorder issues exactly one reorder call', async () => {
    const staged = inScope(() => useStagedMedia(detail, api))
    staged.reorderGallery(0, 1)
    await staged.commit('a1')
    expect(calls).toEqual(['reorder:GALLERY:g2,g1'])
  })

  it('a pending gallery item placed first is resolved to its server id in the reorder call', async () => {
    const staged = inScope(() => useStagedMedia(detail, api))
    staged.addGallery(file('first.png'))
    staged.reorderGallery(2, 0)
    await staged.commit('a1')
    expect(calls).toEqual([
      'add:GALLERY:first.png',
      'reorder:GALLERY:m100,g1,g2',
    ])
  })
})
