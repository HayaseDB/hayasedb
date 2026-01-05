export const PROFILE_PICTURE_BUCKET = 'avatars';

export const PROFILE_PICTURE_MAX_SIZE = 5 * 1024 * 1024;

export const PROFILE_PICTURE_OUTPUT_SIZE = 512;

export const PROFILE_PICTURE_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type ProfilePictureMimeType =
  (typeof PROFILE_PICTURE_ALLOWED_MIME_TYPES)[number];
