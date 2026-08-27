import * as z from 'zod'
import type { AnimeSort, AnimeSortField } from './anime'

export const CURSOR_SORT_FIELDS = ['createdAt', 'title'] as const

export type CursorSortField = (typeof CURSOR_SORT_FIELDS)[number]

export const isCursorSortable = (
  field: AnimeSortField,
): field is CursorSortField =>
  (CURSOR_SORT_FIELDS as readonly string[]).includes(field)

export const cursorPayloadSchema = z.object({
  s: z.enum(CURSOR_SORT_FIELDS),
  o: z.enum(['asc', 'desc']),
  v: z.union([z.string(), z.number(), z.null()]),
  id: z.uuid(),
})

export type CursorPayload = z.output<typeof cursorPayloadSchema>

export const encodeCursor = (payload: CursorPayload): string =>
  Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')

export const decodeCursor = (cursor: string): CursorPayload | undefined => {
  try {
    const json: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    )
    const parsed = cursorPayloadSchema.safeParse(json)
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

export const cursorMatchesSort = (
  payload: CursorPayload,
  sort: AnimeSort,
): boolean => {
  const desc = sort.startsWith('-')
  const field = desc ? sort.slice(1) : sort
  return payload.s === field && payload.o === (desc ? 'desc' : 'asc')
}
