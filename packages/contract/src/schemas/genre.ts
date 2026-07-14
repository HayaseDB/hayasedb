import * as z from 'zod'
import { idSchema } from './common'

export const genreNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name is too long')

export const genreSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const genreListItemSchema = genreSchema.extend({
  animeCount: z.number().int(),
})

export const createGenreInputSchema = z.object({
  name: genreNameSchema,
})

export const updateGenreInputSchema = z.object({
  id: idSchema,
  name: genreNameSchema,
})

export const removeGenreInputSchema = z.object({
  id: idSchema,
})

export type Genre = z.output<typeof genreSchema>
export type GenreListItem = z.output<typeof genreListItemSchema>
export type CreateGenreInput = z.output<typeof createGenreInputSchema>
export type UpdateGenreInput = z.output<typeof updateGenreInputSchema>
