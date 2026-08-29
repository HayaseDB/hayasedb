import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import {
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import type {
  AddAnimeMediaInput,
  AnimeDetail,
  AnimeListItem,
  AnimeRelation,
  AnimeRelationTarget,
  AnimeSort,
  CreateAnimeInput,
  CursorPaginationMeta,
  ListAnimeInput,
  RemoveAnimeMediaInput,
  ReorderAnimeMediaInput,
  UpdateAnimeInput,
} from '@hayasedb/contract'
import {
  cursorMatchesSort,
  decodeCursor,
  encodeCursor,
  isCursorSortable,
  parseAnimeSort,
} from '@hayasedb/contract'
import {
  ANIME_RELATION_VIEW_KINDS,
  fuzzyFromParts,
  type LocalizationLocale,
  relationViewKind,
} from '@hayasedb/domain'
import { DRIZZLE } from '../../database/database.constants'
import {
  localeRankSql,
  preferredLocalized,
  requirePreferredLocalized,
} from '../localization'
import { MediaService } from '../media/media.service'
import { entityHandler, type Tx } from '../revision/registry'
import { RevisionService } from '../revision/revision.service'

function fallbackTranslation(slug: string) {
  return {
    locale: 'en' as LocalizationLocale,
    title: slug,
    description: null,
    original: true,
  }
}

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
    opts: { isAdmin?: boolean; acceptLanguage?: string } = {},
  ): Promise<{
    items: AnimeListItem[]
    meta: CursorPaginationMeta
  }> {
    const conditions = []

    if (!(input.includeDeleted && opts.isAdmin)) {
      conditions.push(isNull(schema.entity.deletedAt))
    }
    if (input.format) conditions.push(eq(schema.anime.format, input.format))
    if (input.status) conditions.push(eq(schema.anime.status, input.status))
    if (input.slug) conditions.push(eq(schema.anime.slug, input.slug))
    if (input.startYearMin !== undefined) {
      conditions.push(gte(schema.anime.startYear, input.startYearMin))
    }
    if (input.startYearMax !== undefined) {
      conditions.push(lte(schema.anime.startYear, input.startYearMax))
    }

    if (input.genre) {
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(schema.animeGenre)
            .where(
              and(
                eq(schema.animeGenre.animeId, schema.anime.id),
                eq(schema.animeGenre.genreId, input.genre),
              ),
            ),
        ),
      )
    }

    if (input.q) {
      const pattern = `%${input.q}%`
      const search = or(
        ilike(schema.anime.slug, pattern),
        exists(
          this.db
            .select({ one: sql`1` })
            .from(schema.animeTranslation)
            .where(
              and(
                eq(schema.animeTranslation.animeId, schema.anime.id),
                ilike(schema.animeTranslation.title, pattern),
              ),
            ),
        ),
      )
      if (search) conditions.push(search)
    }

    const { field, order } = parseAnimeSort(input.sort)
    const direction = order === 'asc' ? asc : desc
    const title = this.localizedTitleSql(opts.acceptLanguage)

    if (input.cursor) {
      conditions.push(this.keysetCondition(input.cursor, input.sort, title))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const orderBy =
      field === 'title'
        ? [direction(title), asc(schema.anime.id)]
        : field === 'startDate'
          ? [
              sql`${direction(schema.anime.startYear)} nulls last`,
              sql`${direction(schema.anime.startMonth)} nulls last`,
              sql`${direction(schema.anime.startDay)} nulls last`,
              asc(schema.anime.id),
            ]
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
          sortTitle: title,
          startYear: schema.anime.startYear,
          startMonth: schema.anime.startMonth,
          startDay: schema.anime.startDay,
          createdAt: schema.anime.createdAt,
          updatedAt: schema.anime.updatedAt,
        })
        .from(schema.anime)
        .innerJoin(schema.entity, eq(schema.entity.id, schema.anime.id))
        .where(where)
        .orderBy(...orderBy)
        .limit(input.limit + 1)
        .offset(input.cursor ? 0 : input.offset),
    ])
    const total = countRow?.total ?? 0

    const hasMore = rows.length > input.limit
    const page = hasMore ? rows.slice(0, input.limit) : rows

    const items = await this.decorateListItems(page, opts.acceptLanguage)

    return {
      items,
      meta: {
        total,
        limit: input.limit,
        offset: input.cursor ? 0 : input.offset,
        hasMore,
        nextCursor: hasMore ? this.mintCursor(page, input.sort) : null,
      },
    }
  }

  private keysetCondition(cursor: string, sort: AnimeSort, title: SQL): SQL {
    const payload = decodeCursor(cursor)
    if (!payload) {
      throw new ORPCError('BAD_REQUEST', { message: 'Invalid cursor' })
    }
    if (!cursorMatchesSort(payload, sort)) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Cursor does not match the requested sort',
      })
    }

    const column = payload.s === 'title' ? title : schema.anime.createdAt
    const value =
      payload.s === 'title' ? payload.v : new Date(payload.v as string)
    const comparator = payload.o === 'asc' ? sql`>` : sql`<`

    return sql`(${column}, ${schema.anime.id}) ${comparator} (${value}, ${payload.id})`
  }

  private mintCursor(
    rows: {
      id: string
      createdAt: Date
      slug: string
      sortTitle: string
    }[],
    sort: AnimeSort,
  ): string | null {
    const { field, order } = parseAnimeSort(sort)
    if (!isCursorSortable(field)) return null

    const last = rows.at(-1)
    if (!last) return null

    const value =
      field === 'title' ? last.sortTitle : last.createdAt.toISOString()

    return encodeCursor({ s: field, o: order, v: value, id: last.id })
  }

  private async decorateListItems(
    rows: Array<{
      id: string
      slug: string
      format: AnimeListItem['format']
      status: AnimeListItem['status']
      sortTitle: string
      startYear: number | null
      startMonth: number | null
      startDay: number | null
      createdAt: Date
      updatedAt: Date
    }>,
    acceptLanguage?: string,
  ): Promise<AnimeListItem[]> {
    if (rows.length === 0) return []
    const ids = rows.map((r) => r.id)

    const [animeTranslations, genreLinks, covers] = await Promise.all([
      this.db
        .select()
        .from(schema.animeTranslation)
        .where(inArray(schema.animeTranslation.animeId, ids)),
      this.db
        .select({
          animeId: schema.animeGenre.animeId,
          genreId: schema.genre.id,
          locale: schema.genreTranslation.locale,
          name: schema.genreTranslation.name,
        })
        .from(schema.animeGenre)
        .innerJoin(schema.genre, eq(schema.genre.id, schema.animeGenre.genreId))
        .innerJoin(
          schema.genreTranslation,
          eq(schema.genreTranslation.genreId, schema.genre.id),
        )
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

    const translationsByAnime = new Map<string, typeof animeTranslations>()
    for (const translation of animeTranslations) {
      const list = translationsByAnime.get(translation.animeId) ?? []
      list.push(translation)
      translationsByAnime.set(translation.animeId, list)
    }

    const genreTranslationsByAnime = new Map<
      string,
      Map<string, { locale: string; name: string }[]>
    >()
    for (const g of genreLinks) {
      const byGenre = genreTranslationsByAnime.get(g.animeId) ?? new Map()
      const list = byGenre.get(g.genreId) ?? []
      list.push({ locale: g.locale, name: g.name })
      byGenre.set(g.genreId, list)
      genreTranslationsByAnime.set(g.animeId, byGenre)
    }

    const coverByAnime = new Map<string, (typeof covers)[number]>()
    for (const c of covers) {
      if (!coverByAnime.has(c.animeId)) coverByAnime.set(c.animeId, c)
    }

    return rows.map((r) => {
      const cover = coverByAnime.get(r.id)
      const translations = (translationsByAnime.get(r.id) ?? []).map(
        ({ locale, title, description, original }) => ({
          locale,
          title,
          description,
          original,
        }),
      )
      const preferred = requirePreferredLocalized(
        translations,
        acceptLanguage,
        fallbackTranslation(r.slug),
      )
      const genres = [...(genreTranslationsByAnime.get(r.id)?.values() ?? [])]
        .flatMap((values) => {
          const selected = preferredLocalized(values, acceptLanguage)
          return selected ? [selected.name] : []
        })
        .sort()
      return {
        id: r.id,
        slug: r.slug,
        format: r.format,
        status: r.status,
        title: {
          locale: preferred.locale,
          title: preferred.title,
          original: preferred.original,
        },
        translations,
        startDate: fuzzyFromParts(r.startYear, r.startMonth, r.startDay),
        coverUrl: cover ? this.media.publicUrl(cover) : null,
        coverBlurhash: cover?.blurhash ?? null,
        genres,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }
    })
  }

  async getById(
    id: string,
    opts: { includeDeleted?: boolean; acceptLanguage?: string } = {},
  ): Promise<AnimeDetail> {
    const detail = await this.buildDetail(id, opts.acceptLanguage)
    if (detail.deletedAt && !opts.includeDeleted) {
      throw new ORPCError('NOT_FOUND', { message: 'Anime not found' })
    }
    return detail
  }

  private async buildDetail(
    animeId: string,
    acceptLanguage?: string,
  ): Promise<AnimeDetail> {
    const [record, entityRow, relations] = await Promise.all([
      this.db.query.anime.findFirst({
        where: eq(schema.anime.id, animeId),
        with: {
          translations: true,
          genres: { with: { genre: { with: { translations: true } } } },
          media: { with: { asset: true } },
        },
      }),
      this.db.query.entity.findFirst({
        where: eq(schema.entity.id, animeId),
      }),
      this.relationsOf(animeId, acceptLanguage),
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

    const translations = record.translations.map(
      ({ locale, title, description, original }) => ({
        locale,
        title,
        description,
        original,
      }),
    )
    const preferred = requirePreferredLocalized(
      translations,
      acceptLanguage,
      fallbackTranslation(record.slug),
    )

    return {
      id: record.id,
      slug: record.slug,
      format: record.format,
      status: record.status,
      title: {
        locale: preferred.locale,
        title: preferred.title,
        original: preferred.original,
      },
      translations,
      description: preferred.description,
      startDate: fuzzyFromParts(
        record.startYear,
        record.startMonth,
        record.startDay,
      ),
      endDate: fuzzyFromParts(record.endYear, record.endMonth, record.endDay),
      genres: record.genres
        .map((g) => {
          const translation = preferredLocalized(
            g.genre.translations,
            acceptLanguage,
          )!
          return {
            id: g.genre.id,
            slug: g.genre.slug,
            name: translation.name,
            locale: translation.locale,
            translations: g.genre.translations,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
      relations,
      media,
      headRev: entityRow.headRev,
      deletedAt: entityRow.deletedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }

  private async relationsOf(
    animeId: string,
    acceptLanguage?: string,
  ): Promise<AnimeRelation[]> {
    const edges = await this.db
      .select({
        sourceId: schema.animeRelation.sourceId,
        targetId: schema.animeRelation.targetId,
        kind: schema.animeRelation.kind,
      })
      .from(schema.animeRelation)
      .where(
        or(
          eq(schema.animeRelation.sourceId, animeId),
          eq(schema.animeRelation.targetId, animeId),
        ),
      )
    if (edges.length === 0) return []

    const otherIds = [
      ...new Set(
        edges.map((e) => (e.sourceId === animeId ? e.targetId : e.sourceId)),
      ),
    ]
    const [rows, translations, covers] = await Promise.all([
      this.db
        .select({
          id: schema.anime.id,
          slug: schema.anime.slug,
          format: schema.anime.format,
          status: schema.anime.status,
          startYear: schema.anime.startYear,
        })
        .from(schema.anime)
        .innerJoin(schema.entity, eq(schema.entity.id, schema.anime.id))
        .where(
          and(
            inArray(schema.anime.id, otherIds),
            isNull(schema.entity.deletedAt),
          ),
        ),
      this.db
        .select()
        .from(schema.animeTranslation)
        .where(inArray(schema.animeTranslation.animeId, otherIds)),
      this.db
        .select({
          animeId: schema.animeMedia.animeId,
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
            inArray(schema.animeMedia.animeId, otherIds),
            eq(schema.animeMedia.type, 'COVER'),
          ),
        )
        .orderBy(asc(schema.animeMedia.position)),
    ])

    const coverByAnime = new Map<string, (typeof covers)[number]>()
    for (const c of covers) {
      if (!coverByAnime.has(c.animeId)) coverByAnime.set(c.animeId, c)
    }
    const targets = new Map<string, AnimeRelationTarget>()
    for (const row of rows) {
      const cover = coverByAnime.get(row.id)
      const localized = translations
        .filter((translation) => translation.animeId === row.id)
        .map(({ locale, title, description, original }) => ({
          locale,
          title,
          description,
          original,
        }))
      const preferred = requirePreferredLocalized(
        localized,
        acceptLanguage,
        fallbackTranslation(row.slug),
      )
      targets.set(row.id, {
        ...row,
        title: {
          locale: preferred.locale,
          title: preferred.title,
          original: preferred.original,
        },
        coverUrl: cover ? this.media.publicUrl(cover) : null,
        coverBlurhash: cover?.blurhash ?? null,
      })
    }

    return edges
      .flatMap((edge) => {
        const owned = edge.sourceId === animeId
        const target = targets.get(owned ? edge.targetId : edge.sourceId)
        if (!target) return []
        return [
          { kind: relationViewKind(edge.kind, owned), owned, anime: target },
        ]
      })
      .sort(
        (a, b) =>
          ANIME_RELATION_VIEW_KINDS.indexOf(a.kind) -
            ANIME_RELATION_VIEW_KINDS.indexOf(b.kind) ||
          (a.anime.startYear ?? Infinity) - (b.anime.startYear ?? Infinity) ||
          a.anime.slug.localeCompare(b.anime.slug),
      )
  }

  async create(
    input: CreateAnimeInput,
    editorId: string | null,
  ): Promise<AnimeDetail> {
    const document = {
      ...input,
      genreIds: [...new Set(input.genreIds ?? [])],
      relations: [],
      media: [],
    }
    await this.assertSlugAvailable(document.slug)

    const animeId = await this.db.transaction(async (tx) => {
      const entityId = await this.revisions.createEntity(tx, { kind: 'anime' })
      await this.assertRefs(tx, document, entityId)
      await entityHandler('anime').apply(tx, 'create', entityId, document, null)
      await this.recordDirectWrite(tx, { entityId, op: 'create', editorId })
      return entityId
    })
    return this.buildDetail(animeId)
  }

  async update(
    input: UpdateAnimeInput,
    editorId: string | null,
  ): Promise<AnimeDetail> {
    const { id, ...rest } = input
    const patch = Object.fromEntries(
      Object.entries(rest).filter(([, value]) => value !== undefined),
    )
    await this.assertAnimeExists(id)
    if (typeof patch.slug === 'string') {
      await this.assertSlugAvailable(patch.slug, id)
    }
    if (Object.keys(patch).length === 0) return this.buildDetail(id)

    await this.db.transaction(async (tx) => {
      await this.assertRefs(tx, patch, id)
      await entityHandler('anime').apply(tx, 'update', id, patch, null)
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
      const blocked = await entityHandler('anime').checkDelete?.(
        tx,
        id,
        new Set(),
      )
      if (blocked) throw new ORPCError('CONFLICT', { message: blocked })
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

  async removeMedia(
    input: RemoveAnimeMediaInput,
    editorId: string | null,
  ): Promise<AnimeDetail> {
    await this.db.transaction(async (tx) => {
      const [row] = await tx
        .delete(schema.animeMedia)
        .where(
          and(
            eq(schema.animeMedia.id, input.mediaId),
            eq(schema.animeMedia.animeId, input.id),
          ),
        )
        .returning({ animeId: schema.animeMedia.animeId })
      if (!row) throw new ORPCError('NOT_FOUND', { message: 'Media not found' })
      await this.recordDirectWrite(tx, {
        entityId: row.animeId,
        op: 'update',
        editorId,
      })
    })
    return this.buildDetail(input.id)
  }

  async reorderMedia(
    input: ReorderAnimeMediaInput,
    editorId: string | null,
  ): Promise<AnimeDetail> {
    await this.assertAnimeExists(input.id)
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
              eq(schema.animeMedia.animeId, input.id),
              eq(schema.animeMedia.type, input.type),
            ),
          )
        await this.recordDirectWrite(tx, {
          entityId: input.id,
          op: 'update',
          editorId,
        })
      })
    }
    return this.buildDetail(input.id)
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

  private async assertRefs(
    tx: Tx,
    payload: Record<string, unknown>,
    entityId: string,
  ): Promise<void> {
    const problems = await entityHandler('anime').validateRefs(
      tx,
      payload,
      new Map(),
      entityId,
    )
    if (problems.length > 0) {
      throw new ORPCError('NOT_FOUND', { message: problems.join('; ') })
    }
  }

  private localizedTitleSql(acceptLanguage?: string): SQL<string> {
    const rank = localeRankSql(
      schema.animeTranslation.locale,
      schema.animeTranslation.original,
      acceptLanguage,
    )
    return sql<string>`lower(coalesce((select ${schema.animeTranslation.title} from ${schema.animeTranslation} where ${schema.animeTranslation.animeId} = ${schema.anime.id} order by ${rank}, ${schema.animeTranslation.locale} limit 1), ${schema.anime.slug}))`
  }
}
