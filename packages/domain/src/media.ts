export const MEDIA_MIME_TYPES = [
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/avif',
] as const

export type MediaMimeType = (typeof MEDIA_MIME_TYPES)[number]
