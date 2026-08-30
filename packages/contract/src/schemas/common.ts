import * as z from 'zod'

export const idSchema = z.uuid().toLowerCase()

export const queryBooleanSchema = z.union([z.boolean(), z.stringbool()])

export const timestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const paginationInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const paginationMetaSchema = z.object({
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
})

export const cursorPaginationMetaSchema = paginationMetaSchema.extend({
  hasMore: z.boolean(),
  nextCursor: z.string().nullable(),
})

export const MAX_ORDERED_ITEMS = 500

export const orderEtagSchema = z.string().min(1)

export const orderInputSchema = z.object({
  orderedIds: z.array(idSchema).max(MAX_ORDERED_ITEMS),
  expectedOrderEtag: orderEtagSchema,
})

export type PaginationInput = z.output<typeof paginationInputSchema>
export type PaginationMeta = z.output<typeof paginationMetaSchema>
export type CursorPaginationMeta = z.output<typeof cursorPaginationMetaSchema>
export type OrderInput = z.output<typeof orderInputSchema>
