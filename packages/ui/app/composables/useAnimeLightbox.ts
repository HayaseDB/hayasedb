import { LazyAnimeLightbox } from '#components'

export interface AnimeLightboxItem {
  id: string
  url: string
  alt: string
}

export interface AnimeLightboxOptions {
  items: AnimeLightboxItem[]
  startIndex?: number
  onNavigate?: (index: number) => void
}

export function useAnimeLightbox() {
  const overlay = useOverlay()
  const lightbox = overlay.create(LazyAnimeLightbox)

  function open(options: AnimeLightboxOptions) {
    lightbox.open(options)
  }

  return { open }
}
