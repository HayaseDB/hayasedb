import type { EntityKind } from '@hayasedb/domain'
import type * as z from 'zod'
import { animeDocumentSchema } from './anime'

export const ENTITY_DOCUMENT_SCHEMAS = {
  anime: animeDocumentSchema,
} as const satisfies Record<EntityKind, z.ZodObject>
