export interface AnimeMediaStagedItem {
  key: string
  url: string
}

export interface AnimeMediaController {
  cover: { readonly value: AnimeMediaStagedItem | null }
  banner: { readonly value: AnimeMediaStagedItem | null }
  gallery: { readonly value: readonly AnimeMediaStagedItem[] }
  setSingle: (type: 'COVER' | 'BANNER', file: File) => void
  removeSingle: (type: 'COVER' | 'BANNER') => void
  addGallery: (file: File) => void
  removeGallery: (key: string) => void
  reorderGallery: (from: number, to: number) => void
}
