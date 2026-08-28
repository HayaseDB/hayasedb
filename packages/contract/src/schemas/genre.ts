import * as z from 'zod'
import { idSchema } from './common'
import { localeSchema, localizedListSchema } from './localization'

export const genreNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name is too long')

export const genreSlugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(80, 'Slug is too long')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase letters, numbers and single hyphens',
  )

export const genreTranslationSchema = z.object({
  locale: localeSchema,
  name: genreNameSchema.transform((name) => name.normalize('NFC')),
})

export const genreTranslationListSchema = localizedListSchema(
  genreTranslationSchema,
  { minimum: 1, requiredMessage: 'At least one localized name is required' },
)

export const genreSchema = z.object({
  id: z.string(),
  slug: genreSlugSchema,
  name: genreNameSchema,
  locale: localeSchema,
  translations: genreTranslationListSchema,
})

export const genreListItemSchema = genreSchema.extend({
  animeCount: z.number().int(),
})

export const listGenresInputSchema = z.object({
  q: z.string().trim().max(60).optional(),
  name: genreNameSchema.optional(),
})

export const createGenreInputSchema = z.object({
  slug: genreSlugSchema,
  translations: genreTranslationListSchema,
})

export const updateGenreInputSchema = z
  .object({
    id: idSchema,
    slug: genreSlugSchema.optional(),
    translations: genreTranslationListSchema.optional(),
  })
  .refine(
    (input) => input.slug !== undefined || input.translations !== undefined,
    { message: 'At least one field is required' },
  )

export const removeGenreInputSchema = z.object({
  id: idSchema,
})

export const genreDocumentSchema = z.object({
  slug: genreSlugSchema,
  translations: genreTranslationListSchema,
})

export const genreDocumentPatchSchema = genreDocumentSchema.partial()

export type Genre = z.output<typeof genreSchema>
export type GenreListItem = z.output<typeof genreListItemSchema>
export type ListGenresInput = z.output<typeof listGenresInputSchema>
export type CreateGenreInput = z.output<typeof createGenreInputSchema>
export type UpdateGenreInput = z.output<typeof updateGenreInputSchema>
export type GenreDocument = z.output<typeof genreDocumentSchema>
export type GenreTranslation = z.output<typeof genreTranslationSchema>
