import type { EntityKind } from '@hayasedb/domain'
import type * as z from 'zod'
import { animeDocumentPatchSchema, animeDocumentSchema } from './anime'
import { genreDocumentPatchSchema, genreDocumentSchema } from './genre'

export const ENTITY_DOCUMENT_SCHEMAS = {
  anime: animeDocumentSchema,
  genre: genreDocumentSchema,
} as const satisfies Record<EntityKind, z.ZodObject>

export const ENTITY_DOCUMENT_PATCH_SCHEMAS = {
  anime: animeDocumentPatchSchema,
  genre: genreDocumentPatchSchema,
} as const satisfies Record<EntityKind, z.ZodObject>
