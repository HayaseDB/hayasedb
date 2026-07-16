export interface StagedExistingItem {
  key: string
  kind: 'existing'
  id: string
  url: string
}

export interface StagedPendingItem {
  key: string
  kind: 'pending'
  file: File
  url: string
}

export type StagedMediaItem = StagedExistingItem | StagedPendingItem

export type SingleMediaSlot = 'COVER' | 'BANNER'

export function useMediaStaging(
  initial: () => {
    cover: StagedExistingItem | null
    banner: StagedExistingItem | null
    gallery: StagedExistingItem[]
  },
) {
  let tempSeq = 0
  const pendingUrls = new Set<string>()

  const start = initial()
  const cover = ref<StagedMediaItem | null>(start.cover)
  const banner = ref<StagedMediaItem | null>(start.banner)
  const gallery = ref<StagedMediaItem[]>(start.gallery)

  function makePending(file: File): StagedPendingItem {
    const url = URL.createObjectURL(file)
    pendingUrls.add(url)
    tempSeq += 1
    return { key: `pending-${tempSeq}`, kind: 'pending', file, url }
  }

  function revoke(item: StagedMediaItem) {
    if (item.kind === 'pending' && pendingUrls.has(item.url)) {
      URL.revokeObjectURL(item.url)
      pendingUrls.delete(item.url)
    }
  }

  function slotFor(type: SingleMediaSlot) {
    return type === 'COVER' ? cover : banner
  }

  function setSingle(type: SingleMediaSlot, file: File) {
    const slot = slotFor(type)
    if (slot.value) revoke(slot.value)
    slot.value = makePending(file)
  }

  function removeSingle(type: SingleMediaSlot) {
    const slot = slotFor(type)
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

  function sync() {
    for (const item of [cover.value, banner.value, ...gallery.value]) {
      if (item) revoke(item)
    }
    const next = initial()
    cover.value = next.cover
    banner.value = next.banner
    gallery.value = next.gallery
  }

  function staged(): Array<StagedMediaItem | null> {
    return [cover.value, banner.value, ...gallery.value]
  }

  const isDirty = computed(() => {
    const start = initial()
    return (
      JSON.stringify(stagedFingerprint(staged())) !==
      JSON.stringify(
        stagedFingerprint([start.cover, start.banner, ...start.gallery]),
      )
    )
  })

  onScopeDispose(() => {
    for (const url of pendingUrls) URL.revokeObjectURL(url)
    pendingUrls.clear()
  })

  return {
    cover,
    banner,
    gallery,
    setSingle,
    removeSingle,
    addGallery,
    removeGallery,
    reorderGallery,
    sync,
    staged,
    isDirty,
  }
}

export function stagedFingerprint(
  items: Array<StagedMediaItem | null>,
): Array<string | null> {
  return items.map((item) =>
    !item ? null : item.kind === 'existing' ? item.id : item.key,
  )
}
