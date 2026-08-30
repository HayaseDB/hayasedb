import type { EntityKind } from '@hayasedb/domain'
import type * as z from 'zod'
import { animeDocumentPatchSchema, animeDocumentSchema } from './anime'
import {
  animeEpisodeDocumentPatchSchema,
  animeEpisodeDocumentSchema,
  animeSeasonDocumentPatchSchema,
  animeSeasonDocumentSchema,
} from './episode'
import { genreDocumentPatchSchema, genreDocumentSchema } from './genre'

export const ENTITY_DOCUMENT_SCHEMAS = {
  anime: animeDocumentSchema,
  animeSeason: animeSeasonDocumentSchema,
  animeEpisode: animeEpisodeDocumentSchema,
  genre: genreDocumentSchema,
} as const satisfies Record<EntityKind, z.ZodType<Record<string, unknown>>>

export const ENTITY_DOCUMENT_PATCH_SCHEMAS = {
  anime: animeDocumentPatchSchema,
  animeSeason: animeSeasonDocumentPatchSchema,
  animeEpisode: animeEpisodeDocumentPatchSchema,
  genre: genreDocumentPatchSchema,
} as const satisfies Record<EntityKind, z.ZodObject>
