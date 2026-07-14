import type { AnimeMediaType } from '@hayasedb/contract'

type MediaItem = {
  id: string
  type: AnimeMediaType
  position: number
  url: string
}

type AnimeDetail = { media: MediaItem[] }

type ExistingItem = {
  key: string
  kind: 'existing'
  id: string
  url: string
}

type PendingItem = {
  key: string
  kind: 'pending'
  file: File
  url: string
}

export type StagedItem = ExistingItem | PendingItem

type MediaApi = {
  addMedia: (input: {
    animeId: string
    type: AnimeMediaType
    file: File
  }) => Promise<AnimeDetail>
  removeMedia: (input: { id: string }) => Promise<AnimeDetail>
  reorderMedia: (input: {
    animeId: string
    type: AnimeMediaType
    orderedIds: string[]
  }) => Promise<AnimeDetail>
}

function existingOf(
  anime: AnimeDetail | null | undefined,
  type: AnimeMediaType,
) {
  return (anime?.media ?? [])
    .filter((m) => m.type === type)
    .sort((a, b) => a.position - b.position)
    .map((m): ExistingItem => ({
      key: m.id,
      kind: 'existing',
      id: m.id,
      url: m.url,
    }))
}

function singleOf(anime: AnimeDetail | null | undefined, type: AnimeMediaType) {
  return existingOf(anime, type)[0] ?? null
}

export function useStagedMedia(
  source: () => AnimeDetail | null | undefined,
  api: MediaApi,
) {
  let tempSeq = 0
  const pendingUrls = new Set<string>()

  function makePending(file: File): PendingItem {
    const url = URL.createObjectURL(file)
    pendingUrls.add(url)
    tempSeq += 1
    return { key: `pending-${tempSeq}`, kind: 'pending', file, url }
  }

  function revoke(item: StagedItem) {
    if (item.kind === 'pending' && pendingUrls.has(item.url)) {
      URL.revokeObjectURL(item.url)
      pendingUrls.delete(item.url)
    }
  }

  const cover = ref<StagedItem | null>(singleOf(source(), 'COVER'))
  const banner = ref<StagedItem | null>(singleOf(source(), 'BANNER'))
  const gallery = ref<StagedItem[]>(existingOf(source(), 'GALLERY'))

  function sync() {
    for (const item of [cover.value, banner.value, ...gallery.value]) {
      if (item) revoke(item)
    }
    cover.value = singleOf(source(), 'COVER')
    banner.value = singleOf(source(), 'BANNER')
    gallery.value = existingOf(source(), 'GALLERY')
  }

  function setSingle(type: 'COVER' | 'BANNER', file: File) {
    const slot = type === 'COVER' ? cover : banner
    if (slot.value) revoke(slot.value)
    slot.value = makePending(file)
  }

  function removeSingle(type: 'COVER' | 'BANNER') {
    const slot = type === 'COVER' ? cover : banner
    if (slot.value) revoke(slot.value)
    slot.value = null
  }

  function addGallery(file: File) {
    gallery.value = [...gallery.value, makePending(file)]
  }

  function removeGallery(key: string) {
    const item = gallery.value.find((m) => m.key === key)
    if (item) revoke(item)
    gallery.value = gallery.value.filter((m) => m.key !== key)
  }

  function reorderGallery(from: number, to: number) {
    if (from === to) return
    const next = [...gallery.value]
    const [moved] = next.splice(from, 1)
    if (moved === undefined) return
    next.splice(to, 0, moved)
    gallery.value = next
  }

  function singleState(item: StagedItem | null) {
    if (!item) return { id: null as string | null }
    return item.kind === 'existing' ? { id: item.id } : { pending: item.key }
  }

  const dirtyState = computed(() => ({
    cover: singleState(cover.value),
    banner: singleState(banner.value),
    gallery: gallery.value.map((m) =>
      m.kind === 'existing' ? { id: m.id } : { pending: m.key },
    ),
  }))

  const baseline = computed(() => ({
    cover: { id: singleOf(source(), 'COVER')?.id ?? null },
    banner: { id: singleOf(source(), 'BANNER')?.id ?? null },
    gallery: existingOf(source(), 'GALLERY').map((m) => ({ id: m.id })),
  }))

  const isDirty = computed(
    () => JSON.stringify(dirtyState.value) !== JSON.stringify(baseline.value),
  )

  async function commitSingle(animeId: string, type: 'COVER' | 'BANNER') {
    const item = type === 'COVER' ? cover.value : banner.value
    const currentId = singleOf(source(), type)?.id ?? null

    if (!item) {
      if (currentId) await api.removeMedia({ id: currentId })
      return
    }
    if (item.kind === 'pending') {
      if (currentId) await api.removeMedia({ id: currentId })
      await api.addMedia({ animeId, type, file: item.file })
    }
  }

  async function commitGallery(animeId: string) {
    const currentIds = existingOf(source(), 'GALLERY').map((m) => m.id)
    const keptIds = new Set(
      gallery.value
        .filter((m): m is ExistingItem => m.kind === 'existing')
        .map((m) => m.id),
    )
    for (const id of currentIds) {
      if (!keptIds.has(id)) await api.removeMedia({ id })
    }

    const known = new Set(currentIds.filter((id) => keptIds.has(id)))
    const resolvedIds: string[] = []
    for (const item of gallery.value) {
      if (item.kind === 'existing') {
        resolvedIds.push(item.id)
        continue
      }
      const detail = await api.addMedia({
        animeId,
        type: 'GALLERY',
        file: item.file,
      })
      const added = detail.media.find(
        (m) => m.type === 'GALLERY' && !known.has(m.id),
      )
      if (added) {
        known.add(added.id)
        resolvedIds.push(added.id)
      }
    }

    const needsReorder =
      resolvedIds.length > 0 &&
      (resolvedIds.length !== currentIds.length ||
        resolvedIds.some((id, i) => id !== currentIds[i]))
    if (needsReorder) {
      await api.reorderMedia({
        animeId,
        type: 'GALLERY',
        orderedIds: resolvedIds,
      })
    }
  }

  async function commit(animeId: string) {
    await commitSingle(animeId, 'COVER')
    await commitSingle(animeId, 'BANNER')
    await commitGallery(animeId)
  }

  onScopeDispose(() => {
    for (const url of pendingUrls) URL.revokeObjectURL(url)
    pendingUrls.clear()
  })

  return {
    cover,
    banner,
    gallery,
    isDirty,
    setSingle,
    removeSingle,
    addGallery,
    removeGallery,
    reorderGallery,
    commit,
    sync,
  }
}
