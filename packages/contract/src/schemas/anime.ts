import {
  ANIME_FIELD_META,
  ANIME_FIELD_ORDER,
  ANIME_FORMATS,
  ANIME_MEDIA_TYPES,
  ANIME_RELATION_KINDS,
  ANIME_RELATION_VIEW_KINDS,
  ANIME_SORT_KEYS,
  ANIME_STATUSES,
  daysInMonth,
  isoToFuzzy,
  type AnimeFormat,
  type AnimeMediaType,
  type AnimeRelationKind,
  type AnimeRelationViewKind,
  type AnimeStatus,
  type FuzzyDate,
} from '@hayasedb/domain'
import * as z from 'zod'
import {
  idSchema,
  paginationInputSchema,
  queryBooleanSchema,
  timestampsSchema,
} from './common'
import { genreSchema } from './genre'
import { mediaFileSchema } from './media'

export const animeFormatSchema = z.enum(ANIME_FORMATS)
export const animeStatusSchema = z.enum(ANIME_STATUSES)
export const animeMediaTypeSchema = z.enum(ANIME_MEDIA_TYPES)
export const animeRelationKindSchema = z.enum(ANIME_RELATION_KINDS)
export const animeRelationViewKindSchema = z.enum(ANIME_RELATION_VIEW_KINDS)

export type {
  AnimeFormat,
  AnimeMediaType,
  AnimeRelationKind,
  AnimeRelationViewKind,
  AnimeStatus,
  FuzzyDate,
}

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

export const animeYearSchema = z.number().int()

export const fuzzyDateSchema = z
  .object({
    year: animeYearSchema,
    month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .nullish()
      .transform((value) => value ?? null),
    day: z
      .number()
      .int()
      .min(1)
      .max(31)
      .nullish()
      .transform((value) => value ?? null),
  })
  .refine((date) => date.day === null || date.month !== null, {
    message: 'A day needs a month',
    path: ['day'],
  })
  .refine(
    (date) =>
      date.day === null ||
      date.month === null ||
      date.day <= daysInMonth(date.year, date.month),
    { message: 'Day does not exist in that month', path: ['day'] },
  )

export const releaseDateSchema = z.preprocess(
  blankToNull,
  z.union([fuzzyDateSchema, z.iso.date().transform(isoToFuzzy)]).nullish(),
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
  startDate: fuzzyDateSchema.nullable(),
  ...timestampsSchema.shape,
})

export const animeRelationTargetSchema = z.object({
  id: z.string(),
  slug: z.string(),
  format: animeFormatSchema.nullable(),
  status: animeStatusSchema.nullable(),
  titleRomaji: z.string().nullable(),
  titleEnglish: z.string().nullable(),
  startYear: z.number().int().nullable(),
  coverUrl: z.string().nullable(),
  coverBlurhash: z.string().nullable(),
})

export const animeRelationSchema = z.object({
  kind: animeRelationViewKindSchema,
  owned: z.boolean(),
  anime: animeRelationTargetSchema,
})

export const animeListItemSchema = animeCoreSchema.extend({
  coverUrl: z.string().nullable(),
  coverBlurhash: z.string().nullable(),
  genres: z.array(z.string()),
})

export const animeDetailSchema = animeCoreSchema.extend({
  description: z.string().nullable(),
  endDate: fuzzyDateSchema.nullable(),
  genres: z.array(genreSchema),
  relations: z.array(animeRelationSchema),
  media: z.array(animeMediaSchema),
  headRev: z.number().int(),
  deletedAt: z.date().nullable(),
})

export const animeSortFieldSchema = z.enum(['createdAt', 'title', 'startDate'])
export const sortOrderSchema = z.enum(['asc', 'desc'])

export const animeSortSchema = z.enum(ANIME_SORT_KEYS)

export type AnimeSort = z.infer<typeof animeSortSchema>
export type AnimeSortField = z.infer<typeof animeSortFieldSchema>

export interface ParsedAnimeSort {
  field: AnimeSortField
  order: z.infer<typeof sortOrderSchema>
}

export const parseAnimeSort = (sort: AnimeSort): ParsedAnimeSort =>
  sort.startsWith('-')
    ? { field: sort.slice(1) as AnimeSortField, order: 'desc' }
    : { field: sort as AnimeSortField, order: 'asc' }

export const listAnimeInputSchema = paginationInputSchema.extend({
  q: z.string().trim().max(120).optional(),
  slug: slugSchema.optional(),
  format: animeFormatSchema.optional(),
  status: animeStatusSchema.optional(),
  genre: idSchema.optional(),
  startYearMin: z.coerce.number().pipe(animeYearSchema).optional(),
  startYearMax: z.coerce.number().pipe(animeYearSchema).optional(),
  sort: animeSortSchema.default('-createdAt'),
  cursor: z.string().min(1).max(512).optional(),
  includeDeleted: queryBooleanSchema.default(false),
})

export const animeDocumentRelationSchema = z.object({
  targetId: idSchema,
  kind: animeRelationKindSchema,
})

export const animeDocumentRelationListSchema = z
  .array(animeDocumentRelationSchema)
  .max(50, 'Too many relations')
  .superRefine((items, ctx) => {
    const seen = new Set<string>()
    for (const item of items) {
      const key = `${item.targetId}:${item.kind}`
      if (seen.has(key)) {
        ctx.addIssue({ code: 'custom', message: 'Duplicate relation' })
        return
      }
      seen.add(key)
    }
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

export const updateAnimeInputSchema = createAnimeInputSchema.partial().extend({
  id: idSchema,
  relations: animeDocumentRelationListSchema.optional(),
})

export const addAnimeMediaInputSchema = z.object({
  id: idSchema,
  type: animeMediaTypeSchema,
  file: mediaFileSchema,
})

export const removeAnimeMediaInputSchema = z.object({
  id: idSchema,
  mediaId: idSchema,
})

export const reorderAnimeMediaInputSchema = z.object({
  id: idSchema,
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
  relations: animeDocumentRelationListSchema.optional(),
  media: animeDocumentMediaListSchema,
})

export const animeDocumentPatchSchema = animeDocumentSchema.partial()

export type AnimeDocument = z.output<typeof animeDocumentSchema>
export type AnimeDocumentPatch = z.output<typeof animeDocumentPatchSchema>
export type AnimeDocumentMedia = z.output<typeof animeDocumentMediaSchema>
export type AnimeDocumentRelation = z.output<typeof animeDocumentRelationSchema>
export type AnimeRelation = z.output<typeof animeRelationSchema>
export type AnimeRelationTarget = z.output<typeof animeRelationTargetSchema>

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
