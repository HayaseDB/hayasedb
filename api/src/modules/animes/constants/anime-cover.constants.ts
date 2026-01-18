export const ANIME_COVER_BUCKET = 'anime-covers';

export const ANIME_COVER_MAX_SIZE = 10 * 1024 * 1024;

export const ANIME_COVER_OUTPUT_WIDTH = 460;

export const ANIME_COVER_OUTPUT_HEIGHT = 650;

export const ANIME_COVER_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type AnimeCoverMimeType =
  (typeof ANIME_COVER_ALLOWED_MIME_TYPES)[number];
