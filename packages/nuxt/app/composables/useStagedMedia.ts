import type { AnimeMediaType } from '@hayasedb/contract'
import type { StagedExistingItem } from './useMediaStaging'

type MediaItem = {
  id: string
  type: AnimeMediaType
  position: number
  url: string
}

type AnimeDetail = { media: MediaItem[] }

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
): StagedExistingItem[] {
  return (anime?.media ?? [])
    .filter((m) => m.type === type)
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      key: m.id,
      kind: 'existing' as const,
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
  const initial = () => ({
    cover: singleOf(source(), 'COVER'),
    banner: singleOf(source(), 'BANNER'),
    gallery: existingOf(source(), 'GALLERY'),
  })

  const staging = useMediaStaging(initial)
  const { cover, banner, gallery, isDirty } = staging

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
        .filter((m): m is StagedExistingItem => m.kind === 'existing')
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

  return {
    cover,
    banner,
    gallery,
    isDirty,
    setSingle: staging.setSingle,
    removeSingle: staging.removeSingle,
    addGallery: staging.addGallery,
    removeGallery: staging.removeGallery,
    reorderGallery: staging.reorderGallery,
    commit,
    sync: staging.sync,
  }
}
