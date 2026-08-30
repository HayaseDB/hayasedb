import { and, eq, inArray, isNull } from 'drizzle-orm'
import {
  animeEpisodeDocumentPatchSchema,
  animeEpisodeDocumentSchema,
  type AnimeEpisodeDocument,
} from '@hayasedb/contract'
import { schema } from '@hayasedb/db'
import type { ChangeOp, EntityKind } from '@hayasedb/domain'
import type { EntityKindHandler, Tx } from './types'

async function replaceTranslations(
  tx: Tx,
  episodeId: string,
  translations: AnimeEpisodeDocument['translations'],
): Promise<void> {
  await tx
    .delete(schema.animeEpisodeTranslation)
    .where(eq(schema.animeEpisodeTranslation.episodeId, episodeId))
  if (translations.length > 0) {
    await tx
      .insert(schema.animeEpisodeTranslation)
      .values(
        translations.map((translation) => ({ episodeId, ...translation })),
      )
  }
}

async function liveEntityExists(
  tx: Tx,
  id: string,
  kind: EntityKind,
): Promise<boolean> {
  const [row] = await tx
    .select({ id: schema.entity.id })
    .from(schema.entity)
    .where(
      and(
        eq(schema.entity.id, id),
        eq(schema.entity.kind, kind),
        isNull(schema.entity.deletedAt),
      ),
    )
    .limit(1)
  return !!row
}

export const episodeHandler: EntityKindHandler<AnimeEpisodeDocument> = {
  kind: 'animeEpisode',
  mediaLinkTable: {
    table: 'anime_episode',
    mediaIdColumn: 'still_media_id',
  },

  parseDocument(payload) {
    return animeEpisodeDocumentSchema.parse(payload)
  },

  parsePatch(payload) {
    return animeEpisodeDocumentPatchSchema.parse(payload)
  },

  async serialize(tx, entityId) {
    const doc = (await this.serializeMany(tx, [entityId])).get(entityId)
    if (!doc)
      throw new Error(`Cannot serialize missing anime episode ${entityId}`)
    return doc
  },

  async serializeMany(tx, entityIds) {
    const ids = [...new Set(entityIds)]
    if (ids.length === 0) return new Map()
    const [rows, translations] = await Promise.all([
      tx
        .select()
        .from(schema.animeEpisode)
        .where(inArray(schema.animeEpisode.id, ids)),
      tx
        .select()
        .from(schema.animeEpisodeTranslation)
        .where(inArray(schema.animeEpisodeTranslation.episodeId, ids)),
    ])
    const byEpisode = new Map<string, AnimeEpisodeDocument['translations']>()
    for (const row of translations) {
      const list = byEpisode.get(row.episodeId) ?? []
      list.push({
        locale: row.locale,
        title: row.title,
        overview: row.overview,
        original: row.original,
      })
      byEpisode.set(row.episodeId, list)
    }
    return new Map(
      rows.map((row) => [
        row.id,
        animeEpisodeDocumentSchema.parse({
          animeId: row.animeId,
          seasonId: row.seasonId,
          number: row.number,
          position: row.position,
          type: row.type,
          status: row.status,
          airDate: row.airDate,
          durationSeconds: row.durationSeconds,
          stillMediaId: row.stillMediaId,
          translations: byEpisode.get(row.id) ?? [],
        }),
      ]),
    )
  },

  async validateRefs(tx, payload, siblingCreates) {
    const problems: string[] = []
    if (typeof payload.animeId === 'string') {
      if (
        siblingCreates.get(payload.animeId) !== 'anime' &&
        !(await liveEntityExists(tx, payload.animeId, 'anime'))
      ) {
        problems.push('Referenced anime does not exist')
      }
    }
    if (typeof payload.seasonId === 'string') {
      if (
        siblingCreates.get(payload.seasonId) !== 'animeSeason' &&
        !(await liveEntityExists(tx, payload.seasonId, 'animeSeason'))
      ) {
        problems.push('Referenced season does not exist')
      }
    }
    if (typeof payload.stillMediaId === 'string') {
      const [media] = await tx
        .select({ id: schema.mediaAsset.id })
        .from(schema.mediaAsset)
        .where(eq(schema.mediaAsset.id, payload.stillMediaId))
        .limit(1)
      if (!media) problems.push('Referenced still image does not exist')
    }
    return problems
  },

  async checkUniqueness() {
    return null
  },

  async apply(tx, op: ChangeOp, entityId, payload, prevDoc) {
    if (op === 'delete') {
      await tx
        .delete(schema.animeEpisode)
        .where(eq(schema.animeEpisode.id, entityId))
      return
    }
    if (op === 'create') {
      const doc = this.parseDocument(payload)
      const columns = {
        animeId: doc.animeId,
        seasonId: doc.seasonId,
        number: doc.number,
        position: doc.position,
        type: doc.type,
        status: doc.status,
        airDate: doc.airDate,
        durationSeconds: doc.durationSeconds,
        stillMediaId: doc.stillMediaId,
      }
      await tx
        .insert(schema.animeEpisode)
        .values({ id: entityId, ...columns })
        .onConflictDoUpdate({ target: schema.animeEpisode.id, set: columns })
      await replaceTranslations(tx, entityId, doc.translations)
      return
    }
    if (!prevDoc)
      throw new Error('Episode update requires its previous document')
    const patch = this.parsePatch(payload)
    const next = this.parseDocument({ ...prevDoc, ...patch })
    await tx
      .update(schema.animeEpisode)
      .set({
        animeId: next.animeId,
        seasonId: next.seasonId,
        number: next.number,
        position: next.position,
        type: next.type,
        status: next.status,
        airDate: next.airDate,
        durationSeconds: next.durationSeconds,
        stillMediaId: next.stillMediaId,
      })
      .where(eq(schema.animeEpisode.id, entityId))
    if (patch.translations !== undefined) {
      await replaceTranslations(tx, entityId, next.translations)
    }
  },
}
