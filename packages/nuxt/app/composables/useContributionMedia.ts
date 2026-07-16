import type {
  AnimeDocumentMedia,
  AnimeMediaType,
  ContributionDisplay,
} from '@hayasedb/contract'
import type { StagedExistingItem } from './useMediaStaging'

type SourceMediaItem = {
  id: string
  mediaId: string
  type: AnimeMediaType
  position: number
  url: string
}

type SourceAnime = { media: SourceMediaItem[] }

export type ContributionStagedItem = StagedMediaItem

export interface ContributionMediaPrefill {
  media: AnimeDocumentMedia[]
  display: Pick<ContributionDisplay, 'mediaAssets'>
}

export function useContributionMedia(
  source: () => SourceAnime | null | undefined,
  prefill?: MaybeRefOrGetter<ContributionMediaPrefill | null | undefined>,
) {
  function existingFromSource(type: AnimeMediaType): StagedExistingItem[] {
    return (source()?.media ?? [])
      .filter((m) => m.type === type)
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        key: m.id,
        kind: 'existing' as const,
        id: m.mediaId,
        url: m.url,
      }))
  }

  function existingFromPrefill(type: AnimeMediaType): StagedExistingItem[] {
    const current = toValue(prefill)
    if (!current) return []
    return current.media
      .filter((m) => m.type === type)
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        key: `prefill-${type}-${m.mediaId}`,
        kind: 'existing' as const,
        id: m.mediaId,
        url: current.display.mediaAssets[m.mediaId]?.url ?? '',
      }))
  }

  function initial() {
    const items = toValue(prefill) ? existingFromPrefill : existingFromSource
    return {
      cover: items('COVER')[0] ?? null,
      banner: items('BANNER')[0] ?? null,
      gallery: items('GALLERY'),
    }
  }

  const staging = useMediaStaging(initial)

  async function buildDocumentMedia(
    upload: (file: File) => Promise<{ mediaId: string }>,
  ): Promise<AnimeDocumentMedia[]> {
    async function resolve(item: ContributionStagedItem): Promise<string> {
      if (item.kind === 'existing') return item.id
      const { mediaId } = await upload(item.file)
      return mediaId
    }

    const result: AnimeDocumentMedia[] = []
    if (staging.cover.value) {
      result.push({
        mediaId: await resolve(staging.cover.value),
        type: 'COVER',
        position: 0,
      })
    }
    if (staging.banner.value) {
      result.push({
        mediaId: await resolve(staging.banner.value),
        type: 'BANNER',
        position: 0,
      })
    }
    const seenGallery = new Set<string>()
    for (const item of staging.gallery.value) {
      const mediaId = await resolve(item)
      if (seenGallery.has(mediaId)) continue
      seenGallery.add(mediaId)
      result.push({ mediaId, type: 'GALLERY', position: seenGallery.size - 1 })
    }
    return result
  }

  return {
    cover: staging.cover,
    banner: staging.banner,
    gallery: staging.gallery,
    isDirty: staging.isDirty,
    setSingle: staging.setSingle,
    removeSingle: staging.removeSingle,
    addGallery: staging.addGallery,
    removeGallery: staging.removeGallery,
    reorderGallery: staging.reorderGallery,
    buildDocumentMedia,
    sync: staging.sync,
  }
}
