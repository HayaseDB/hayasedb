export const MEDIA_MIME_TYPES = [
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/avif',
] as const

export type MediaMimeType = (typeof MEDIA_MIME_TYPES)[number]

export const MEDIA_OUTPUT_MIME_TYPE = 'image/webp'
export const MEDIA_OUTPUT_EXTENSION = 'webp'
export const MEDIA_OUTPUT_QUALITY = 85
export const MEDIA_MAX_DIMENSION = 2048

export const MEDIA_CACHE_CONTROL = 'public, max-age=31536000, immutable'

export const MEDIA_KEY_NAMESPACE = 'media'

export const MEDIA_OBJECT_NAME = 'original'

export function mediaKeyPrefix(checksumSha256: string): string {
  return `${MEDIA_KEY_NAMESPACE}/${checksumSha256}`
}

export function mediaObjectKey(checksumSha256: string): string {
  return `${mediaKeyPrefix(checksumSha256)}/${MEDIA_OBJECT_NAME}.${MEDIA_OUTPUT_EXTENSION}`
}
