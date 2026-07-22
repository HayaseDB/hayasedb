import { and, eq, inArray, isNull, ne, sql } from 'drizzle-orm'
import {
  genreDocumentPatchSchema,
  genreDocumentSchema,
  type GenreDocument,
} from '@hayasedb/contract'
import { schema } from '@hayasedb/db'
import type { ChangeOp } from '@hayasedb/domain'
import type { EntityKindHandler, Tx } from './types'

const GENRE_LABEL_FIELDS = ['name'] as const

export const genreHandler: EntityKindHandler<GenreDocument> = {
  kind: 'genre',

  parseDocument(payload: unknown): GenreDocument {
    return genreDocumentSchema.parse(payload)
  },

  parsePatch(payload: unknown): Partial<GenreDocument> {
    return genreDocumentPatchSchema.parse(payload)
  },

  async serialize(tx: Tx, entityId: string): Promise<GenreDocument> {
    const doc = (await genreHandler.serializeMany(tx, [entityId])).get(entityId)
    if (!doc) throw new Error(`Cannot serialize missing genre ${entityId}`)
    return doc
  },

  async serializeMany(
    tx: Tx,
    entityIds: string[],
  ): Promise<Map<string, GenreDocument>> {
    const ids = [...new Set(entityIds)]
    if (ids.length === 0) return new Map()

    const rows = await tx
      .select({ id: schema.genre.id, name: schema.genre.name })
      .from(schema.genre)
      .where(inArray(schema.genre.id, ids))
    return new Map(rows.map((row) => [row.id, { name: row.name }]))
  },

  labelFields: GENRE_LABEL_FIELDS,

  label(doc: Record<string, unknown>): string {
    const name = doc.name
    return typeof name === 'string' && name.length > 0 ? name : '(unnamed)'
  },

  async validateRefs(): Promise<string[]> {
    return []
  },

  async checkUniqueness(
    tx: Tx,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<string | null> {
    const name = payload.name
    if (typeof name !== 'string') return null
    const [row] = await tx
      .select({ id: schema.genre.id })
      .from(schema.genre)
      .where(
        and(
          sql`lower(${schema.genre.name}) = lower(${name})`,
          ne(schema.genre.id, entityId),
        ),
      )
      .limit(1)
    return row ? `A genre named "${name}" already exists` : null
  },

  async checkDelete(
    tx: Tx,
    entityId: string,
    siblingDeletes: ReadonlySet<string>,
  ): Promise<string | null> {
    const rows = await tx
      .select({ animeId: schema.animeGenre.animeId })
      .from(schema.animeGenre)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.animeGenre.animeId))
      .where(
        and(
          eq(schema.animeGenre.genreId, entityId),
          isNull(schema.entity.deletedAt),
        ),
      )
    const blocking = rows.filter((row) => !siblingDeletes.has(row.animeId))
    return blocking.length > 0 ? 'Genre is still in use by anime' : null
  },

  async apply(
    tx: Tx,
    op: ChangeOp,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (op === 'delete') return

    if (op === 'create') {
      const doc = this.parseDocument(payload)
      await tx
        .insert(schema.genre)
        .values({ id: entityId, name: doc.name })
        .onConflictDoUpdate({
          target: schema.genre.id,
          set: { name: doc.name },
        })
      return
    }

    const patch = this.parsePatch(payload)
    if (patch.name !== undefined) {
      await tx
        .update(schema.genre)
        .set({ name: patch.name })
        .where(eq(schema.genre.id, entityId))
    }
  },
}
