import { and, eq, inArray, isNull } from 'drizzle-orm'
import {
  animeSeasonDocumentPatchSchema,
  animeSeasonDocumentSchema,
  type AnimeSeasonDocument,
} from '@hayasedb/contract'
import { schema } from '@hayasedb/db'
import type { ChangeOp } from '@hayasedb/domain'
import type { EntityKindHandler, Tx } from './types'

async function replaceTranslations(
  tx: Tx,
  seasonId: string,
  translations: AnimeSeasonDocument['translations'],
): Promise<void> {
  await tx
    .delete(schema.animeSeasonTranslation)
    .where(eq(schema.animeSeasonTranslation.seasonId, seasonId))
  if (translations.length > 0) {
    await tx.insert(schema.animeSeasonTranslation).values(
      translations.map((translation) => ({
        seasonId,
        ...translation,
      })),
    )
  }
}

export const seasonHandler: EntityKindHandler<AnimeSeasonDocument> = {
  kind: 'animeSeason',

  parseDocument(payload) {
    return animeSeasonDocumentSchema.parse(payload)
  },

  parsePatch(payload) {
    return animeSeasonDocumentPatchSchema.parse(payload)
  },

  async serialize(tx, entityId) {
    const doc = (await this.serializeMany(tx, [entityId])).get(entityId)
    if (!doc)
      throw new Error(`Cannot serialize missing anime season ${entityId}`)
    return doc
  },

  async serializeMany(tx, entityIds) {
    const ids = [...new Set(entityIds)]
    if (ids.length === 0) return new Map()
    const [rows, translations] = await Promise.all([
      tx
        .select()
        .from(schema.animeSeason)
        .where(inArray(schema.animeSeason.id, ids)),
      tx
        .select()
        .from(schema.animeSeasonTranslation)
        .where(inArray(schema.animeSeasonTranslation.seasonId, ids)),
    ])
    const bySeason = new Map<string, AnimeSeasonDocument['translations']>()
    for (const row of translations) {
      const list = bySeason.get(row.seasonId) ?? []
      list.push({
        locale: row.locale,
        title: row.title,
        original: row.original,
      })
      bySeason.set(row.seasonId, list)
    }
    return new Map(
      rows.map((row) => [
        row.id,
        animeSeasonDocumentSchema.parse({
          animeId: row.animeId,
          kind: row.kind,
          number: row.number,
          position: row.position,
          translations: bySeason.get(row.id) ?? [],
        }),
      ]),
    )
  },

  async validateRefs(tx, payload, siblingCreates) {
    if (typeof payload.animeId !== 'string') return []
    if (siblingCreates.get(payload.animeId) === 'anime') return []
    const [anime] = await tx
      .select({ id: schema.entity.id })
      .from(schema.entity)
      .where(
        and(
          eq(schema.entity.id, payload.animeId),
          eq(schema.entity.kind, 'anime'),
          isNull(schema.entity.deletedAt),
        ),
      )
      .limit(1)
    return anime ? [] : ['Referenced anime does not exist']
  },

  async checkUniqueness() {
    return null
  },

  async checkDelete(tx, entityId, siblingDeletes, plannedChanges = []) {
    const children = await tx
      .select({ id: schema.animeEpisode.id })
      .from(schema.animeEpisode)
      .where(eq(schema.animeEpisode.seasonId, entityId))
    const changes = new Map(
      plannedChanges.map((change) => [change.entityId, change]),
    )
    return children.some((row) => {
      if (siblingDeletes.has(row.id)) return false
      const change = changes.get(row.id)
      if (
        change?.op !== 'update' ||
        !change.payload ||
        typeof change.payload !== 'object'
      ) {
        return true
      }
      const payload = change.payload as Record<string, unknown>
      return !(
        ('seasonId' in payload && payload.seasonId !== entityId) ||
        ('animeId' in payload && typeof payload.animeId === 'string')
      )
    })
      ? 'Season still contains episodes'
      : null
  },

  async apply(tx, op: ChangeOp, entityId, payload, prevDoc) {
    if (op === 'delete') {
      await tx
        .delete(schema.animeSeason)
        .where(eq(schema.animeSeason.id, entityId))
      return
    }
    if (op === 'create') {
      const doc = this.parseDocument(payload)
      const columns = {
        animeId: doc.animeId,
        kind: doc.kind,
        number: doc.number,
        position: doc.position,
      }
      await tx
        .insert(schema.animeSeason)
        .values({ id: entityId, ...columns })
        .onConflictDoUpdate({ target: schema.animeSeason.id, set: columns })
      await replaceTranslations(tx, entityId, doc.translations)
      return
    }
    if (!prevDoc)
      throw new Error('Season update requires its previous document')
    const patch = this.parsePatch(payload)
    const next = this.parseDocument({ ...prevDoc, ...patch })
    await tx
      .update(schema.animeSeason)
      .set({ kind: next.kind, number: next.number, position: next.position })
      .where(eq(schema.animeSeason.id, entityId))
    if (patch.translations !== undefined) {
      await replaceTranslations(tx, entityId, next.translations)
    }
  },
}
