import type { EntityKind } from '@hayasedb/domain'
import type * as z from 'zod'
import { animeDocumentSchema } from './anime'
import { genreDocumentSchema } from './genre'

export const ENTITY_DOCUMENT_SCHEMAS = {
  anime: animeDocumentSchema,
  genre: genreDocumentSchema,
} as const satisfies Record<EntityKind, z.ZodObject>
