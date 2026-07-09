import * as z from 'zod'

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024

export const AVATAR_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const

export const avatarFileSchema = z
  .file()
  .max(AVATAR_MAX_BYTES, 'Image must be 5MB or smaller')
  .mime([...AVATAR_ALLOWED_MIME_TYPES], 'Unsupported image type')

export const uploadAvatarInputSchema = z.object({
  file: avatarFileSchema,
})

export const uploadAvatarOutputSchema = z.object({
  image: z.string(),
  avatar: z.object({
    id: z.string(),
    url: z.string(),
    createdAt: z.date(),
  }),
})

export type UploadAvatarInput = z.output<typeof uploadAvatarInputSchema>
export type UploadAvatarOutput = z.output<typeof uploadAvatarOutputSchema>
