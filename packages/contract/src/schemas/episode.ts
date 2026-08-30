import {
  ANIME_EPISODE_STATUSES,
  ANIME_EPISODE_TYPES,
  ANIME_SEASON_KINDS,
  type AnimeEpisodeStatus,
  type AnimeEpisodeType,
  type AnimeSeasonKind,
} from '@hayasedb/domain'
import * as z from 'zod'
import {
  cursorPaginationMetaSchema,
  idSchema,
  orderEtagSchema,
  orderInputSchema,
  timestampsSchema,
} from './common'
import {
  localizedEpisodeTextListSchema,
  localizedEpisodeTextSchema,
  localizedTitleListSchema,
  localizedTitleSchema,
} from './localization'

export type { AnimeEpisodeStatus, AnimeEpisodeType, AnimeSeasonKind }

export const animeSeasonKindSchema = z.enum(ANIME_SEASON_KINDS)
export const animeEpisodeTypeSchema = z.enum(ANIME_EPISODE_TYPES)
export const animeEpisodeStatusSchema = z.enum(ANIME_EPISODE_STATUSES)

export const episodeNumberSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,4})(?:\.\d{1,3})?$/, 'Invalid episode number')
  .nullable()

export const animeSeasonDocumentSchema = z.object({
  animeId: idSchema,
  kind: animeSeasonKindSchema,
  number: episodeNumberSchema,
  position: z.number().int().min(0),
  translations: localizedTitleListSchema.default([]),
})

const animeEpisodeDocumentBaseSchema = z.object({
  animeId: idSchema.nullable(),
  seasonId: idSchema.nullable(),
  number: episodeNumberSchema,
  position: z.number().int().min(0),
  type: animeEpisodeTypeSchema,
  status: animeEpisodeStatusSchema,
  airDate: z.iso.date().nullable(),
  durationSeconds: z.number().int().positive().nullable(),
  stillMediaId: idSchema.nullable(),
  translations: localizedEpisodeTextListSchema.default([]),
})

export const animeEpisodeDocumentSchema = animeEpisodeDocumentBaseSchema.refine(
  (doc) => Number(doc.animeId !== null) + Number(doc.seasonId !== null) === 1,
  {
    message: 'An episode must belong directly to an anime or to one season',
    path: ['seasonId'],
  },
)

export const animeSeasonDocumentPatchSchema = animeSeasonDocumentSchema
  .partial()
  .omit({ animeId: true })

export const animeEpisodeDocumentPatchSchema =
  animeEpisodeDocumentBaseSchema.partial()

export const animeSeasonSchema = animeSeasonDocumentSchema.extend({
  id: idSchema,
  title: localizedTitleSchema.nullable(),
  episodeCount: z.number().int().min(0),
  firstAirDate: z.iso.date().nullable(),
  lastAirDate: z.iso.date().nullable(),
  headRev: z.number().int().min(1),
  ...timestampsSchema.shape,
})

export const animeEpisodeSchema = animeEpisodeDocumentBaseSchema.extend({
  id: idSchema,
  title: localizedTitleSchema.nullable(),
  overview: localizedEpisodeTextSchema.shape.overview,
  headRev: z.number().int().min(1),
  ...timestampsSchema.shape,
})

export const listStructureInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(512).optional(),
})

export const listAnimeEpisodesInputSchema = listStructureInputSchema.extend({
  animeId: idSchema,
  seasonId: idSchema.optional(),
})

export const animeSeasonListSchema = z.object({
  items: z.array(animeSeasonSchema),
  meta: cursorPaginationMetaSchema,
  orderEtag: orderEtagSchema,
})

export const animeEpisodeListSchema = z.object({
  items: z.array(animeEpisodeSchema),
  meta: cursorPaginationMetaSchema,
  orderEtag: orderEtagSchema,
})

export const createAnimeSeasonInputSchema = animeSeasonDocumentSchema
  .omit({ position: true, translations: true })
  .extend({ translations: localizedTitleListSchema.optional() })

export const updateAnimeSeasonInputSchema = animeSeasonDocumentPatchSchema
  .omit({ position: true, translations: true })
  .extend({ id: idSchema })

export const createAnimeEpisodeFieldsSchema = animeEpisodeDocumentBaseSchema
  .omit({ animeId: true, seasonId: true, position: true, translations: true })
  .extend({ translations: localizedEpisodeTextListSchema.optional() })

export const createAnimeEpisodeForAnimeInputSchema =
  createAnimeEpisodeFieldsSchema.extend({ animeId: idSchema })

export const createAnimeEpisodeForSeasonInputSchema =
  createAnimeEpisodeFieldsSchema.extend({ seasonId: idSchema })

export const updateAnimeEpisodeInputSchema = animeEpisodeDocumentPatchSchema
  .omit({ animeId: true, seasonId: true, position: true, translations: true })
  .extend({ id: idSchema })

export const reorderAnimeSeasonsInputSchema = orderInputSchema.extend({
  animeId: idSchema,
})

export const reorderAnimeEpisodesForAnimeInputSchema = orderInputSchema.extend({
  animeId: idSchema,
})

export const reorderAnimeEpisodesForSeasonInputSchema = orderInputSchema.extend(
  { seasonId: idSchema },
)

export type AnimeSeasonDocument = z.output<typeof animeSeasonDocumentSchema>
export type AnimeEpisodeDocument = z.output<typeof animeEpisodeDocumentSchema>
export type AnimeSeason = z.output<typeof animeSeasonSchema>
export type AnimeEpisode = z.output<typeof animeEpisodeSchema>
export type CreateAnimeSeasonInput = z.output<
  typeof createAnimeSeasonInputSchema
>
export type UpdateAnimeSeasonInput = z.output<
  typeof updateAnimeSeasonInputSchema
>
export type CreateAnimeEpisodeForAnimeInput = z.output<
  typeof createAnimeEpisodeForAnimeInputSchema
>
export type CreateAnimeEpisodeForSeasonInput = z.output<
  typeof createAnimeEpisodeForSeasonInputSchema
>
export type UpdateAnimeEpisodeInput = z.output<
  typeof updateAnimeEpisodeInputSchema
>
export type ReorderAnimeSeasonsInput = z.output<
  typeof reorderAnimeSeasonsInputSchema
>
export type ReorderAnimeEpisodesForAnimeInput = z.output<
  typeof reorderAnimeEpisodesForAnimeInputSchema
>
export type ReorderAnimeEpisodesForSeasonInput = z.output<
  typeof reorderAnimeEpisodesForSeasonInputSchema
>
