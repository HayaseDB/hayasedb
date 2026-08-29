import { and, eq, inArray, isNull, ne } from 'drizzle-orm'
import {
  genreDocumentPatchSchema,
  genreDocumentSchema,
  type GenreDocument,
} from '@hayasedb/contract'
import { schema } from '@hayasedb/db'
import type { ChangeOp } from '@hayasedb/domain'
import type { EntityKindHandler, Tx } from './types'

async function replaceTranslations(
  tx: Tx,
  entityId: string,
  translations: GenreDocument['translations'],
): Promise<void> {
  await tx
    .delete(schema.genreTranslation)
    .where(eq(schema.genreTranslation.genreId, entityId))
  await tx.insert(schema.genreTranslation).values(
    translations.map((translation) => ({
      genreId: entityId,
      ...translation,
    })),
  )
}

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

    const [rows, translations] = await Promise.all([
      tx
        .select({ id: schema.genre.id, slug: schema.genre.slug })
        .from(schema.genre)
        .where(inArray(schema.genre.id, ids)),
      tx
        .select()
        .from(schema.genreTranslation)
        .where(inArray(schema.genreTranslation.genreId, ids)),
    ])
    return new Map(
      rows.map((row) => [
        row.id,
        genreDocumentSchema.parse({
          slug: row.slug,
          translations: translations
            .filter((translation) => translation.genreId === row.id)
            .map(({ locale, name }) => ({ locale, name })),
        }),
      ]),
    )
  },

  async validateRefs(): Promise<string[]> {
    return []
  },

  async checkUniqueness(
    tx: Tx,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<string | null> {
    const slug = payload.slug
    if (typeof slug !== 'string') return null
    const [row] = await tx
      .select({ id: schema.genre.id })
      .from(schema.genre)
      .where(and(eq(schema.genre.slug, slug), ne(schema.genre.id, entityId)))
      .limit(1)
    return row ? `Genre slug "${slug}" is already taken` : null
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
        .values({ id: entityId, slug: doc.slug })
        .onConflictDoUpdate({
          target: schema.genre.id,
          set: { slug: doc.slug },
        })
      await replaceTranslations(tx, entityId, doc.translations)
      return
    }

    const patch = this.parsePatch(payload)
    if (patch.slug !== undefined) {
      await tx
        .update(schema.genre)
        .set({ slug: patch.slug })
        .where(eq(schema.genre.id, entityId))
    }
    if (patch.translations !== undefined) {
      await replaceTranslations(tx, entityId, patch.translations)
    }
  },
}
