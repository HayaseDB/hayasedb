import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import {
  and,
  asc,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import type {
  AddAnimeMediaInput,
  AnimeDetail,
  AnimeListItem,
  CreateAnimeInput,
  ListAnimeInput,
  ReorderAnimeMediaInput,
  UpdateAnimeInput,
} from '@hayasedb/contract'
import { DRIZZLE } from '../../database/database.constants'
import { MediaService } from '../media/media.service'
import { entityHandler, type Tx } from '../revision/registry'
import { RevisionService } from '../revision/revision.service'

@Injectable()
export class AnimeService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly media: MediaService,
    private readonly revisions: RevisionService,
  ) {}

  private async recordDirectWrite(
    tx: Tx,
    opts: {
      entityId: string
      op: 'create' | 'update' | 'delete'
      editorId: string | null
      document?: Record<string, unknown>
    },
  ): Promise<void> {
    const document =
      opts.document ??
      (await entityHandler('anime').serialize(tx, opts.entityId))
    await this.revisions.record(tx, {
      entityId: opts.entityId,
      op: opts.op,
      editorId: opts.editorId,
      changesetId: null,
      document,
    })
  }

  async list(
    input: ListAnimeInput,
    opts: { isAdmin?: boolean } = {},
  ): Promise<{
    items: AnimeListItem[]
    meta: { total: number; limit: number; offset: number }
  }> {
    const conditions = []

    if (!(input.includeDeleted && opts.isAdmin)) {
      conditions.push(isNull(schema.entity.deletedAt))
    }
    if (input.format) conditions.push(eq(schema.anime.format, input.format))
    if (input.status) conditions.push(eq(schema.anime.status, input.status))

    if (input.genreId) {
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(schema.animeGenre)
            .where(
              and(
                eq(schema.animeGenre.animeId, schema.anime.id),
                eq(schema.animeGenre.genreId, input.genreId),
              ),
            ),
        ),
      )
    }

    if (input.q) {
      const pattern = `%${input.q}%`
      const search = or(
        ilike(schema.anime.slug, pattern),
        ilike(schema.anime.titleEnglish, pattern),
        ilike(schema.anime.titleRomaji, pattern),
        ilike(schema.anime.titleNative, pattern),
      )
      if (search) conditions.push(search)
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const direction = input.order === 'asc' ? asc : desc
    const title = sql`lower(coalesce(${schema.anime.titleEnglish}, ${schema.anime.titleRomaji}, ${schema.anime.titleNative}, ${schema.anime.slug}))`
    const orderBy =
      input.sort === 'title'
        ? [direction(title), asc(schema.anime.id)]
        : [direction(schema.anime.createdAt), asc(schema.anime.id)]

    const [[countRow], rows] = await Promise.all([
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.anime)
        .innerJoin(schema.entity, eq(schema.entity.id, schema.anime.id))
        .where(where),
      this.db
        .select({
          id: schema.anime.id,
          slug: schema.anime.slug,
          format: schema.anime.format,
          status: schema.anime.status,
          titleRomaji: schema.anime.titleRomaji,
          titleEnglish: schema.anime.titleEnglish,
          titleNative: schema.anime.titleNative,
          createdAt: schema.anime.createdAt,
          updatedAt: schema.anime.updatedAt,
        })
        .from(schema.anime)
        .innerJoin(schema.entity, eq(schema.entity.id, schema.anime.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(input.limit)
        .offset(input.offset),
    ])
    const total = countRow?.total ?? 0

    const items = await this.decorateListItems(rows)

    return {
      items,
      meta: { total, limit: input.limit, offset: input.offset },
    }
  }

  private async decorateListItems(
    rows: Array<{
      id: string
      slug: string
      format: AnimeListItem['format']
      status: AnimeListItem['status']
      titleRomaji: string | null
      titleEnglish: string | null
      titleNative: string | null
      createdAt: Date
      updatedAt: Date
    }>,
  ): Promise<AnimeListItem[]> {
    if (rows.length === 0) return []
    const ids = rows.map((r) => r.id)

    const [genreLinks, covers] = await Promise.all([
      this.db
        .select({
          animeId: schema.animeGenre.animeId,
          name: schema.genre.name,
        })
        .from(schema.animeGenre)
        .innerJoin(schema.genre, eq(schema.genre.id, schema.animeGenre.genreId))
        .where(inArray(schema.animeGenre.animeId, ids)),
      this.db
        .select({
          animeId: schema.animeMedia.animeId,
          position: schema.animeMedia.position,
          storageKey: schema.mediaAsset.storageKey,
          blurhash: schema.mediaAsset.blurhash,
        })
        .from(schema.animeMedia)
        .innerJoin(
          schema.mediaAsset,
          eq(schema.mediaAsset.id, schema.animeMedia.mediaId),
        )
        .where(
          and(
            inArray(schema.animeMedia.animeId, ids),
            eq(schema.animeMedia.type, 'COVER'),
          ),
        )
        .orderBy(asc(schema.animeMedia.position)),
    ])

    const genresByAnime = new Map<string, string[]>()
    for (const g of genreLinks) {
      const list = genresByAnime.get(g.animeId) ?? []
      list.push(g.name)
      genresByAnime.set(g.animeId, list)
    }

    const coverByAnime = new Map<string, (typeof covers)[number]>()
    for (const c of covers) {
      if (!coverByAnime.has(c.animeId)) coverByAnime.set(c.animeId, c)
    }

    return rows.map((r) => {
      const cover = coverByAnime.get(r.id)
      return {
        id: r.id,
        slug: r.slug,
        format: r.format,
        status: r.status,
        titleRomaji: r.titleRomaji,
        titleEnglish: r.titleEnglish,
        titleNative: r.titleNative,
        coverUrl: cover ? this.media.publicUrl(cover) : null,
        coverBlurhash: cover?.blurhash ?? null,
        genres: (genresByAnime.get(r.id) ?? []).sort(),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }
    })
  }

  async getBySlug(
    slug: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<AnimeDetail> {
    const [row] = await this.db
      .select({ id: schema.anime.id })
      .from(schema.anime)
      .where(eq(schema.anime.slug, slug))
      .limit(1)
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'Anime not found' })
    return this.getById(row.id, opts)
  }

  async getById(
    id: string,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<AnimeDetail> {
    const detail = await this.buildDetail(id)
    if (detail.deletedAt && !opts.includeDeleted) {
      throw new ORPCError('NOT_FOUND', { message: 'Anime not found' })
    }
    return detail
  }

  private async buildDetail(animeId: string): Promise<AnimeDetail> {
    const [record, entityRow] = await Promise.all([
      this.db.query.anime.findFirst({
        where: eq(schema.anime.id, animeId),
        with: {
          genres: { with: { genre: true } },
          media: { with: { asset: true } },
        },
      }),
      this.db.query.entity.findFirst({
        where: eq(schema.entity.id, animeId),
      }),
    ])
    if (!record || !entityRow)
      throw new ORPCError('NOT_FOUND', { message: 'Anime not found' })

    const media = [...record.media]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        id: m.id,
        mediaId: m.mediaId,
        type: m.type,
        position: m.position,
        url: this.media.publicUrl(m.asset),
        blurhash: m.asset.blurhash,
        width: m.asset.width,
        height: m.asset.height,
      }))

    return {
      id: record.id,
      slug: record.slug,
      format: record.format,
      status: record.status,
      titleRomaji: record.titleRomaji,
      titleEnglish: record.titleEnglish,
      titleNative: record.titleNative,
      description: record.description,
      startDate: record.startDate,
      endDate: record.endDate,
      genres: record.genres
        .map((g) => ({ id: g.genre.id, name: g.genre.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      media,
      headRev: entityRow.headRev,
      deletedAt: entityRow.deletedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }

  async create(
    input: CreateAnimeInput,
    editorId: string | null,
  ): Promise<AnimeDetail> {
    const { genreIds, ...fields } = input
    await this.assertSlugAvailable(fields.slug)
    const uniqueGenreIds = [...new Set(genreIds ?? [])]
    await this.assertGenresExist(uniqueGenreIds)

    const animeId = await this.db.transaction(async (tx) => {
      const entityId = await this.revisions.createEntity(tx, { kind: 'anime' })
      await tx.insert(schema.anime).values({ id: entityId, ...fields })
      if (uniqueGenreIds.length > 0) {
        await tx
          .insert(schema.animeGenre)
          .values(
            uniqueGenreIds.map((genreId) => ({ animeId: entityId, genreId })),
          )
      }
      await this.recordDirectWrite(tx, { entityId, op: 'create', editorId })
      return entityId
    })
    return this.buildDetail(animeId)
  }

  async update(
    input: UpdateAnimeInput,
    editorId: string | null,
  ): Promise<AnimeDetail> {
    const { id, genreIds, ...patch } = input
    await this.assertAnimeExists(id)
    if (patch.slug !== undefined) await this.assertSlugAvailable(patch.slug, id)
    const uniqueGenreIds = genreIds && [...new Set(genreIds)]
    if (uniqueGenreIds) await this.assertGenresExist(uniqueGenreIds)

    if (Object.keys(patch).length === 0 && !uniqueGenreIds) {
      return this.buildDetail(id)
    }

    await this.db.transaction(async (tx) => {
      if (Object.keys(patch).length > 0) {
        await tx.update(schema.anime).set(patch).where(eq(schema.anime.id, id))
      }
      if (uniqueGenreIds) {
        await tx
          .delete(schema.animeGenre)
          .where(eq(schema.animeGenre.animeId, id))
        if (uniqueGenreIds.length > 0) {
          await tx
            .insert(schema.animeGenre)
            .values(uniqueGenreIds.map((genreId) => ({ animeId: id, genreId })))
        }
      }
      await this.recordDirectWrite(tx, { entityId: id, op: 'update', editorId })
    })
    return this.buildDetail(id)
  }

  async remove(id: string, editorId: string | null): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [entityRow] = await tx
        .select()
        .from(schema.entity)
        .where(eq(schema.entity.id, id))
        .for('update')
      if (!entityRow || entityRow.deletedAt) {
        throw new ORPCError('NOT_FOUND', { message: 'Anime not found' })
      }
      const document = await entityHandler('anime').serialize(tx, id)
      await tx
        .update(schema.entity)
        .set({ deletedAt: new Date() })
        .where(eq(schema.entity.id, id))
      await this.recordDirectWrite(tx, {
        entityId: id,
        op: 'delete',
        editorId,
        document,
      })
    })
  }

  async attachMedia(
    input: {
      animeId: string
      mediaId: string
      type: AddAnimeMediaInput['type']
    },
    editorId: string | null,
  ): Promise<AnimeDetail> {
    await this.assertAnimeExists(input.animeId)
    await this.db.transaction(async (tx) => {
      const [positionRow] = await tx
        .select({
          next: sql<number>`coalesce(max(${schema.animeMedia.position}) + 1, 0)`,
        })
        .from(schema.animeMedia)
        .where(
          and(
            eq(schema.animeMedia.animeId, input.animeId),
            eq(schema.animeMedia.type, input.type),
          ),
        )

      await tx
        .insert(schema.animeMedia)
        .values({
          animeId: input.animeId,
          mediaId: input.mediaId,
          type: input.type,
          position: positionRow?.next ?? 0,
        })
        .onConflictDoNothing()
      await this.recordDirectWrite(tx, {
        entityId: input.animeId,
        op: 'update',
        editorId,
      })
    })
    return this.buildDetail(input.animeId)
  }

  async removeMedia(id: string, editorId: string | null): Promise<AnimeDetail> {
    const animeId = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .delete(schema.animeMedia)
        .where(eq(schema.animeMedia.id, id))
        .returning({ animeId: schema.animeMedia.animeId })
      if (!row) throw new ORPCError('NOT_FOUND', { message: 'Media not found' })
      await this.recordDirectWrite(tx, {
        entityId: row.animeId,
        op: 'update',
        editorId,
      })
      return row.animeId
    })
    return this.buildDetail(animeId)
  }

  async reorderMedia(
    input: ReorderAnimeMediaInput,
    editorId: string | null,
  ): Promise<AnimeDetail> {
    await this.assertAnimeExists(input.animeId)
    if (input.orderedIds.length > 0) {
      const cases = sql.join(
        input.orderedIds.map(
          (id, index) =>
            sql`when ${schema.animeMedia.id} = ${id} then ${index}::int`,
        ),
        sql` `,
      )
      await this.db.transaction(async (tx) => {
        await tx
          .update(schema.animeMedia)
          .set({
            position: sql`case ${cases} else ${schema.animeMedia.position} end`,
          })
          .where(
            and(
              inArray(schema.animeMedia.id, input.orderedIds),
              eq(schema.animeMedia.animeId, input.animeId),
              eq(schema.animeMedia.type, input.type),
            ),
          )
        await this.recordDirectWrite(tx, {
          entityId: input.animeId,
          op: 'update',
          editorId,
        })
      })
    }
    return this.buildDetail(input.animeId)
  }

  private async assertAnimeExists(animeId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: schema.anime.id })
      .from(schema.anime)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.anime.id))
      .where(and(eq(schema.anime.id, animeId), isNull(schema.entity.deletedAt)))
      .limit(1)
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'Anime not found' })
  }

  private async assertSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const [row] = await this.db
      .select({ id: schema.anime.id })
      .from(schema.anime)
      .where(
        excludeId
          ? and(eq(schema.anime.slug, slug), ne(schema.anime.id, excludeId))
          : eq(schema.anime.slug, slug),
      )
      .limit(1)
    if (row) {
      throw new ORPCError('CONFLICT', { message: 'That slug is already taken' })
    }
  }

  private async assertGenresExist(genreIds: string[]): Promise<void> {
    if (genreIds.length === 0) return
    const rows = await this.db
      .select({ id: schema.genre.id })
      .from(schema.genre)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.genre.id))
      .where(
        and(
          inArray(schema.genre.id, genreIds),
          isNull(schema.entity.deletedAt),
        ),
      )
    if (rows.length !== genreIds.length) {
      throw new ORPCError('NOT_FOUND', {
        message: 'One or more genres do not exist',
      })
    }
  }
}
