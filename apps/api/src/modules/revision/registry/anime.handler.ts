import { and, eq, getTableName, inArray, isNull, ne } from 'drizzle-orm'
import {
  animeDocumentPatchSchema,
  animeDocumentSchema,
  type AnimeDocument,
  type AnimeDocumentMedia,
} from '@hayasedb/contract'
import { schema } from '@hayasedb/db'
import {
  ANIME_FIELD_ORDER,
  ANIME_MEDIA_TYPES,
  ENTITY_FIELD_META,
  type ChangeOp,
} from '@hayasedb/domain'
import type { EntityKindHandler, Tx } from './types'

const SCALAR_FIELDS = ANIME_FIELD_ORDER.filter(
  (field) => !ENTITY_FIELD_META.anime[field]?.ref,
) as ReadonlyArray<ScalarField>

type ScalarField = Exclude<keyof AnimeDocument, 'genreIds' | 'media'>

const ANIME_LABEL_FIELDS = ['slug', 'titleEnglish', 'titleRomaji'] as const

function scalarPatch(
  doc: Partial<AnimeDocument>,
): Partial<Pick<AnimeDocument, ScalarField>> {
  const patch: Record<string, unknown> = {}
  for (const field of SCALAR_FIELDS) {
    if (field in doc) patch[field] = doc[field]
  }
  return patch as Partial<Pick<AnimeDocument, ScalarField>>
}

function normalizedMedia(items: AnimeDocumentMedia[]): AnimeDocumentMedia[] {
  return ANIME_MEDIA_TYPES.flatMap((type) =>
    items
      .filter((m) => m.type === type)
      .sort((a, b) => a.position - b.position)
      .map((m, position) => ({ mediaId: m.mediaId, type, position })),
  )
}

async function replaceGenres(
  tx: Tx,
  entityId: string,
  genreIds: string[],
): Promise<void> {
  await tx
    .delete(schema.animeGenre)
    .where(eq(schema.animeGenre.animeId, entityId))
  const unique = [...new Set(genreIds)]
  if (unique.length > 0) {
    await tx
      .insert(schema.animeGenre)
      .values(unique.map((genreId) => ({ animeId: entityId, genreId })))
  }
}

async function replaceMedia(
  tx: Tx,
  entityId: string,
  items: AnimeDocumentMedia[],
): Promise<void> {
  await tx
    .delete(schema.animeMedia)
    .where(eq(schema.animeMedia.animeId, entityId))
  const normalized = normalizedMedia(items)
  if (normalized.length > 0) {
    await tx.insert(schema.animeMedia).values(
      normalized.map((m) => ({
        animeId: entityId,
        mediaId: m.mediaId,
        type: m.type,
        position: m.position,
      })),
    )
  }
}

export const animeHandler: EntityKindHandler<AnimeDocument> = {
  kind: 'anime',

  parseDocument(payload: unknown): AnimeDocument {
    return animeDocumentSchema.parse(payload)
  },

  parsePatch(payload: unknown): Partial<AnimeDocument> {
    return animeDocumentPatchSchema.parse(payload)
  },

  async serialize(tx: Tx, entityId: string): Promise<AnimeDocument> {
    const doc = (await animeHandler.serializeMany(tx, [entityId])).get(entityId)
    if (!doc) throw new Error(`Cannot serialize missing anime ${entityId}`)
    return doc
  },

  async serializeMany(
    tx: Tx,
    entityIds: string[],
  ): Promise<Map<string, AnimeDocument>> {
    const ids = [...new Set(entityIds)]
    if (ids.length === 0) return new Map()

    const [rows, genreLinks, mediaLinks] = await Promise.all([
      tx
        .select({
          id: schema.anime.id,
          slug: schema.anime.slug,
          format: schema.anime.format,
          status: schema.anime.status,
          titleRomaji: schema.anime.titleRomaji,
          titleEnglish: schema.anime.titleEnglish,
          titleNative: schema.anime.titleNative,
          description: schema.anime.description,
          startDate: schema.anime.startDate,
          endDate: schema.anime.endDate,
        })
        .from(schema.anime)
        .where(inArray(schema.anime.id, ids)),
      tx
        .select({
          animeId: schema.animeGenre.animeId,
          genreId: schema.animeGenre.genreId,
        })
        .from(schema.animeGenre)
        .where(inArray(schema.animeGenre.animeId, ids)),
      tx
        .select({
          animeId: schema.animeMedia.animeId,
          mediaId: schema.animeMedia.mediaId,
          type: schema.animeMedia.type,
          position: schema.animeMedia.position,
        })
        .from(schema.animeMedia)
        .where(inArray(schema.animeMedia.animeId, ids)),
    ])

    const genresByAnime = new Map<string, string[]>()
    for (const link of genreLinks) {
      const list = genresByAnime.get(link.animeId) ?? []
      list.push(link.genreId)
      genresByAnime.set(link.animeId, list)
    }

    const mediaByAnime = new Map<string, typeof mediaLinks>()
    for (const link of mediaLinks) {
      const list = mediaByAnime.get(link.animeId) ?? []
      list.push(link)
      mediaByAnime.set(link.animeId, list)
    }

    const documents = new Map<string, AnimeDocument>()
    for (const { id, ...row } of rows) {
      documents.set(id, {
        ...row,
        genreIds: (genresByAnime.get(id) ?? []).sort(),
        media: (mediaByAnime.get(id) ?? [])
          .sort(
            (a, b) =>
              ANIME_MEDIA_TYPES.indexOf(a.type) -
                ANIME_MEDIA_TYPES.indexOf(b.type) || a.position - b.position,
          )
          .map((m) => ({
            mediaId: m.mediaId,
            type: m.type,
            position: m.position,
          })),
      })
    }
    return documents
  },

  labelFields: ANIME_LABEL_FIELDS,

  label(doc: Record<string, unknown>): string {
    for (const key of ANIME_LABEL_FIELDS) {
      const value = doc[key]
      if (typeof value === 'string' && value.length > 0) return value
    }
    return '(untitled)'
  },

  mediaLinkTable: {
    table: getTableName(schema.animeMedia),
    mediaIdColumn: schema.animeMedia.mediaId.name,
  },

  async validateRefs(
    tx: Tx,
    payload: Record<string, unknown>,
    siblingCreates: ReadonlyMap<string, string>,
  ): Promise<string[]> {
    const problems: string[] = []

    const genreIds = Array.isArray(payload.genreIds)
      ? [
          ...new Set(
            payload.genreIds.filter((v): v is string => typeof v === 'string'),
          ),
        ]
      : []
    const unknownGenreIds = genreIds.filter(
      (id) => siblingCreates.get(id) !== 'genre',
    )
    if (unknownGenreIds.length > 0) {
      const rows = await tx
        .select({ id: schema.genre.id })
        .from(schema.genre)
        .innerJoin(schema.entity, eq(schema.entity.id, schema.genre.id))
        .where(
          and(
            inArray(schema.genre.id, unknownGenreIds),
            isNull(schema.entity.deletedAt),
          ),
        )
      if (rows.length !== unknownGenreIds.length) {
        problems.push('One or more referenced genres do not exist')
      }
    }

    const mediaIds = Array.isArray(payload.media)
      ? [
          ...new Set(
            payload.media
              .map((m) =>
                m && typeof m === 'object'
                  ? (m as Record<string, unknown>).mediaId
                  : undefined,
              )
              .filter((v): v is string => typeof v === 'string'),
          ),
        ]
      : []
    if (mediaIds.length > 0) {
      const rows = await tx
        .select({ id: schema.mediaAsset.id })
        .from(schema.mediaAsset)
        .where(inArray(schema.mediaAsset.id, mediaIds))
      if (rows.length !== mediaIds.length) {
        problems.push('One or more referenced media uploads do not exist')
      }
    }

    return problems
  },

  async checkUniqueness(
    tx: Tx,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<string | null> {
    const slug = payload.slug
    if (typeof slug !== 'string') return null
    const [row] = await tx
      .select({ id: schema.anime.id })
      .from(schema.anime)
      .where(and(eq(schema.anime.slug, slug), ne(schema.anime.id, entityId)))
      .limit(1)
    return row ? `Slug "${slug}" is already taken` : null
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
      const scalars = scalarPatch(doc)
      await tx
        .insert(schema.anime)
        .values({ id: entityId, ...scalars, slug: doc.slug })
        .onConflictDoUpdate({ target: schema.anime.id, set: scalars })
      await replaceGenres(tx, entityId, doc.genreIds)
      await replaceMedia(tx, entityId, doc.media)
      return
    }

    const patch = this.parsePatch(payload)
    const scalars = scalarPatch(patch)
    if (Object.keys(scalars).length > 0) {
      await tx
        .update(schema.anime)
        .set(scalars)
        .where(eq(schema.anime.id, entityId))
    }
    if (patch.genreIds) await replaceGenres(tx, entityId, patch.genreIds)
    if (patch.media) await replaceMedia(tx, entityId, patch.media)
  },
}
