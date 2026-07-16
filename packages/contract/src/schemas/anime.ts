import {
  ANIME_FIELD_META,
  ANIME_FIELD_ORDER,
  ANIME_FORMATS,
  ANIME_MEDIA_TYPES,
  ANIME_STATUSES,
  type AnimeFormat,
  type AnimeMediaType,
  type AnimeStatus,
} from '@hayasedb/domain'
import * as z from 'zod'
import { idSchema, paginationInputSchema, timestampsSchema } from './common'
import { genreSchema } from './genre'
import { mediaFileSchema } from './media'

export const animeFormatSchema = z.enum(ANIME_FORMATS)
export const animeStatusSchema = z.enum(ANIME_STATUSES)
export const animeMediaTypeSchema = z.enum(ANIME_MEDIA_TYPES)

export type { AnimeFormat, AnimeMediaType, AnimeStatus }

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(120, 'Slug is too long')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase letters, numbers and single hyphens',
  )

const blankToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

export const animeTitleFieldSchema = z.preprocess(
  blankToNull,
  z.string().trim().max(255, 'Title is too long').nullish(),
)

export const animeDescriptionSchema = z.preprocess(
  blankToNull,
  z.string().trim().max(5000, 'Description is too long').nullish(),
)

export const releaseDateSchema = z.preprocess(
  blankToNull,
  z.iso.date().nullish(),
)

export const animeMediaSchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  type: animeMediaTypeSchema,
  position: z.number().int(),
  url: z.string(),
  blurhash: z.string().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
})

const animeCoreSchema = z.object({
  id: z.string(),
  slug: z.string(),
  format: animeFormatSchema.nullable(),
  status: animeStatusSchema.nullable(),
  titleRomaji: z.string().nullable(),
  titleEnglish: z.string().nullable(),
  titleNative: z.string().nullable(),
  ...timestampsSchema.shape,
})

export const animeListItemSchema = animeCoreSchema.extend({
  coverUrl: z.string().nullable(),
  coverBlurhash: z.string().nullable(),
  genres: z.array(z.string()),
})

export const animeDetailSchema = animeCoreSchema.extend({
  description: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  genres: z.array(genreSchema),
  media: z.array(animeMediaSchema),
  headRev: z.number().int(),
  deletedAt: z.date().nullable(),
})

export const animeSortSchema = z.enum(['recent', 'title'])
export const sortOrderSchema = z.enum(['asc', 'desc'])

export const listAnimeInputSchema = paginationInputSchema.extend({
  q: z.string().trim().max(120).optional(),
  format: animeFormatSchema.optional(),
  status: animeStatusSchema.optional(),
  genreId: idSchema.optional(),
  sort: animeSortSchema.default('recent'),
  order: sortOrderSchema.default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  includeDeleted: z.coerce.boolean().default(false),
})

export const createAnimeInputSchema = z.object({
  slug: slugSchema,
  format: animeFormatSchema.nullish(),
  status: animeStatusSchema.nullish(),
  titleRomaji: animeTitleFieldSchema,
  titleEnglish: animeTitleFieldSchema,
  titleNative: animeTitleFieldSchema,
  description: animeDescriptionSchema,
  startDate: releaseDateSchema,
  endDate: releaseDateSchema,
  genreIds: z.array(idSchema).optional(),
})

export const updateAnimeInputSchema = createAnimeInputSchema
  .partial()
  .extend({ id: idSchema })

export const addAnimeMediaInputSchema = z.object({
  animeId: idSchema,
  type: animeMediaTypeSchema,
  file: mediaFileSchema,
})

export const removeAnimeMediaInputSchema = z.object({
  id: idSchema,
})

export const reorderAnimeMediaInputSchema = z.object({
  animeId: idSchema,
  type: animeMediaTypeSchema,
  orderedIds: z.array(idSchema),
})

export const animeDocumentMediaSchema = z.object({
  mediaId: idSchema,
  type: animeMediaTypeSchema,
  position: z.number().int().min(0),
})

export const animeDocumentMediaListSchema = z
  .array(animeDocumentMediaSchema)
  .max(30, 'Too many media items')
  .superRefine((items, ctx) => {
    for (const type of ['COVER', 'BANNER'] as const) {
      if (items.filter((m) => m.type === type).length > 1) {
        ctx.addIssue({ code: 'custom', message: `Only one ${type} allowed` })
      }
    }
  })

export const animeDocumentSchema = createAnimeInputSchema.extend({
  genreIds: z.array(idSchema).max(50),
  media: animeDocumentMediaListSchema,
})

export const animeDocumentPatchSchema = animeDocumentSchema.partial()

export type AnimeDocument = z.output<typeof animeDocumentSchema>
export type AnimeDocumentPatch = z.output<typeof animeDocumentPatchSchema>
export type AnimeDocumentMedia = z.output<typeof animeDocumentMediaSchema>

const _metaCoversSchema: Record<keyof AnimeDocument, unknown> = ANIME_FIELD_META

const _metaHasNoExtras: Record<keyof typeof ANIME_FIELD_META, unknown> =
  animeDocumentSchema.shape

const _orderCoversSchema: Record<(typeof ANIME_FIELD_ORDER)[number], unknown> =
  animeDocumentSchema.shape

void _metaCoversSchema
void _metaHasNoExtras
void _orderCoversSchema

export type AnimeListItem = z.output<typeof animeListItemSchema>
export type AnimeDetail = z.output<typeof animeDetailSchema>
export type ListAnimeInput = z.output<typeof listAnimeInputSchema>
export type CreateAnimeInput = z.output<typeof createAnimeInputSchema>
export type UpdateAnimeInput = z.output<typeof updateAnimeInputSchema>
export type AddAnimeMediaInput = z.output<typeof addAnimeMediaInputSchema>
export type RemoveAnimeMediaInput = z.output<typeof removeAnimeMediaInputSchema>
export type ReorderAnimeMediaInput = z.output<
  typeof reorderAnimeMediaInputSchema
>
