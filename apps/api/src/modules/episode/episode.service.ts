import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  inArray,
  isNull,
  max,
  min,
  sql,
} from 'drizzle-orm'
import { MAX_ORDERED_ITEMS } from '@hayasedb/contract'
import type {
  AnimeEpisode,
  AnimeEpisodeDocument,
  AnimeSeason,
  AnimeSeasonDocument,
  CreateAnimeEpisodeForAnimeInput,
  CreateAnimeEpisodeForSeasonInput,
  CreateAnimeSeasonInput,
  ReorderAnimeEpisodesForAnimeInput,
  ReorderAnimeEpisodesForSeasonInput,
  ReorderAnimeSeasonsInput,
  UpdateAnimeEpisodeInput,
  UpdateAnimeSeasonInput,
} from '@hayasedb/contract'
import { type Database, schema } from '@hayasedb/db'
import { DRIZZLE } from '../../database/database.constants'
import { preferredLocalized } from '../localization'
import { assertOrderCovers, assertOrderEtag, orderEtag } from '../ordering'
import { ChangesetApplyService } from '../revision/changeset-apply.service'
import { entityHandler, type Tx } from '../revision/registry'
import { RevisionService } from '../revision/revision.service'

type SeasonRow = typeof schema.animeSeason.$inferSelect & { headRev: number }
type EpisodeRow = typeof schema.animeEpisode.$inferSelect & { headRev: number }

interface Page<T extends { id: string }> {
  page: T[]
  hasMore: boolean
  nextCursor: string | null
}

function encodeCursor(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64url')
}

function decodeCursor(cursor: string): string {
  const id = Buffer.from(cursor, 'base64url').toString('utf8')
  if (!id) throw new ORPCError('BAD_REQUEST', { message: 'Invalid cursor' })
  return id
}

function paginate<T extends { id: string }>(
  rows: T[],
  limit: number,
  cursor: string | undefined,
): Page<T> {
  const start = cursor
    ? rows.findIndex((row) => row.id === decodeCursor(cursor)) + 1
    : 0
  if (cursor && start === 0) {
    throw new ORPCError('BAD_REQUEST', { message: 'Invalid cursor' })
  }
  const selected = rows.slice(start, start + limit + 1)
  const hasMore = selected.length > limit
  const page = hasMore ? selected.slice(0, limit) : selected
  const last = page.at(-1)
  return {
    page,
    hasMore,
    nextCursor: hasMore && last ? encodeCursor(last.id) : null,
  }
}

@Injectable()
export class EpisodeService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly revisions: RevisionService,
    private readonly applier: ChangesetApplyService,
  ) {}

  private async record(
    tx: Tx,
    kind: 'animeSeason' | 'animeEpisode',
    entityId: string,
    op: 'create' | 'update' | 'delete',
    editorId: string,
    document?: Record<string, unknown>,
  ): Promise<void> {
    await this.revisions.record(tx, {
      entityId,
      op,
      editorId,
      changesetId: null,
      document: document ?? (await entityHandler(kind).serialize(tx, entityId)),
    })
  }

  private async lockLiveEntity(
    tx: Tx,
    id: string,
    kind: 'anime' | 'animeSeason' | 'animeEpisode',
  ) {
    const [row] = await tx
      .select()
      .from(schema.entity)
      .where(
        and(
          eq(schema.entity.id, id),
          eq(schema.entity.kind, kind),
          isNull(schema.entity.deletedAt),
        ),
      )
      .for('update')
    if (!row) {
      throw new ORPCError('NOT_FOUND', { message: 'Resource not found' })
    }
    return row
  }

  private seasonRows(animeId: string) {
    return this.db
      .select({
        ...getTableColumns(schema.animeSeason),
        headRev: schema.entity.headRev,
      })
      .from(schema.animeSeason)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.animeSeason.id))
      .where(eq(schema.animeSeason.animeId, animeId))
      .orderBy(asc(schema.animeSeason.position), asc(schema.animeSeason.id))
  }

  async listSeasons(
    animeId: string,
    limit: number,
    cursor: string | undefined,
  ) {
    const rows = await this.seasonRows(animeId)
    const paged = paginate(rows, limit, cursor)
    return {
      items: await this.decorateSeasons(paged.page),
      meta: {
        total: rows.length,
        limit,
        offset: 0,
        hasMore: paged.hasMore,
        nextCursor: paged.nextCursor,
      },
      orderEtag: orderEtag(rows.map((row) => row.id)),
    }
  }

  async getSeason(id: string): Promise<AnimeSeason> {
    const [row] = await this.db
      .select({
        ...getTableColumns(schema.animeSeason),
        headRev: schema.entity.headRev,
      })
      .from(schema.animeSeason)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.animeSeason.id))
      .where(eq(schema.animeSeason.id, id))
      .limit(1)
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'Season not found' })
    const [season] = await this.decorateSeasons([row])
    if (!season) {
      throw new ORPCError('NOT_FOUND', { message: 'Season not found' })
    }
    return season
  }

  private async decorateSeasons(rows: SeasonRow[]): Promise<AnimeSeason[]> {
    if (rows.length === 0) return []
    const ids = rows.map((row) => row.id)
    const [documents, aggregates] = await Promise.all([
      entityHandler('animeSeason').serializeMany(this.db, ids),
      this.db
        .select({
          seasonId: schema.animeEpisode.seasonId,
          episodeCount: count(),
          firstAirDate: min(schema.animeEpisode.airDate),
          lastAirDate: max(schema.animeEpisode.airDate),
        })
        .from(schema.animeEpisode)
        .where(inArray(schema.animeEpisode.seasonId, ids))
        .groupBy(schema.animeEpisode.seasonId),
    ])
    const aggregateById = new Map(
      aggregates.map((aggregate) => [aggregate.seasonId, aggregate]),
    )
    return rows.flatMap((row) => {
      const document = documents.get(row.id) as AnimeSeasonDocument | undefined
      if (!document) return []
      const aggregate = aggregateById.get(row.id)
      return [
        {
          id: row.id,
          ...document,
          title: preferredLocalized(document.translations),
          episodeCount: aggregate?.episodeCount ?? 0,
          firstAirDate: aggregate?.firstAirDate ?? null,
          lastAirDate: aggregate?.lastAirDate ?? null,
          headRev: row.headRev,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
      ]
    })
  }

  async createSeason(
    input: CreateAnimeSeasonInput,
    editorId: string,
  ): Promise<AnimeSeason> {
    const id = await this.db.transaction(async (tx) => {
      await this.lockLiveEntity(tx, input.animeId, 'anime')
      const position = await this.nextAnimeChildPosition(tx, input.animeId)
      const document = entityHandler('animeSeason').parseDocument({
        ...input,
        position,
        translations: input.translations ?? [],
      })
      const entityId = await this.revisions.createEntity(tx, {
        kind: 'animeSeason',
      })
      await entityHandler('animeSeason').apply(
        tx,
        'create',
        entityId,
        document,
        null,
      )
      await this.record(tx, 'animeSeason', entityId, 'create', editorId)
      return entityId
    })
    return this.getSeason(id)
  }

  async updateSeason(
    input: UpdateAnimeSeasonInput,
    editorId: string,
  ): Promise<AnimeSeason> {
    const { id, ...values } = input
    const patch = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined),
    )
    if (Object.keys(patch).length === 0) return this.getSeason(id)
    await this.db.transaction(async (tx) => {
      await this.lockLiveEntity(tx, id, 'animeSeason')
      const previous = await entityHandler('animeSeason').serialize(tx, id)
      await entityHandler('animeSeason').apply(
        tx,
        'update',
        id,
        patch,
        previous,
      )
      await this.record(tx, 'animeSeason', id, 'update', editorId)
    })
    return this.getSeason(id)
  }

  async removeSeason(id: string, editorId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.lockLiveEntity(tx, id, 'animeSeason')
      const previous = await entityHandler('animeSeason').serialize(tx, id)
      const blocked = await entityHandler('animeSeason').checkDelete?.(
        tx,
        id,
        new Set(),
      )
      if (blocked) throw new ORPCError('CONFLICT', { message: blocked })
      await entityHandler('animeSeason').apply(tx, 'delete', id, {}, previous)
      await tx
        .update(schema.entity)
        .set({ deletedAt: new Date() })
        .where(eq(schema.entity.id, id))
      await this.record(tx, 'animeSeason', id, 'delete', editorId, previous)
    })
  }

  private episodeRowsForAnime(animeId: string, seasonId?: string) {
    const conditions = [eq(schema.anime.id, animeId)]
    if (seasonId) conditions.push(eq(schema.animeEpisode.seasonId, seasonId))
    return this.db
      .select({
        ...getTableColumns(schema.animeEpisode),
        headRev: schema.entity.headRev,
      })
      .from(schema.animeEpisode)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.animeEpisode.id))
      .leftJoin(
        schema.animeSeason,
        eq(schema.animeSeason.id, schema.animeEpisode.seasonId),
      )
      .innerJoin(
        schema.anime,
        sql`${schema.anime.id} = coalesce(${schema.animeEpisode.animeId}, ${schema.animeSeason.animeId})`,
      )
      .where(and(...conditions))
      .orderBy(
        sql`coalesce(${schema.animeSeason.position}, ${schema.animeEpisode.position}) asc`,
        asc(schema.animeEpisode.position),
        asc(schema.animeEpisode.id),
      )
  }

  private episodeRowsForSeason(seasonId: string) {
    return this.db
      .select({
        ...getTableColumns(schema.animeEpisode),
        headRev: schema.entity.headRev,
      })
      .from(schema.animeEpisode)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.animeEpisode.id))
      .where(eq(schema.animeEpisode.seasonId, seasonId))
      .orderBy(asc(schema.animeEpisode.position), asc(schema.animeEpisode.id))
  }

  async listEpisodesForAnime(
    animeId: string,
    seasonId: string | undefined,
    limit: number,
    cursor: string | undefined,
  ) {
    return this.episodePage(
      await this.episodeRowsForAnime(animeId, seasonId),
      limit,
      cursor,
    )
  }

  async listEpisodesForSeason(
    seasonId: string,
    limit: number,
    cursor: string | undefined,
  ) {
    return this.episodePage(
      await this.episodeRowsForSeason(seasonId),
      limit,
      cursor,
    )
  }

  private async episodePage(
    rows: EpisodeRow[],
    limit: number,
    cursor: string | undefined,
  ) {
    const paged = paginate(rows, limit, cursor)
    return {
      items: await this.decorateEpisodes(paged.page),
      meta: {
        total: rows.length,
        limit,
        offset: 0,
        hasMore: paged.hasMore,
        nextCursor: paged.nextCursor,
      },
      orderEtag: orderEtag(rows.map((row) => row.id)),
    }
  }

  async getEpisode(id: string): Promise<AnimeEpisode> {
    const [row] = await this.db
      .select({
        ...getTableColumns(schema.animeEpisode),
        headRev: schema.entity.headRev,
      })
      .from(schema.animeEpisode)
      .innerJoin(schema.entity, eq(schema.entity.id, schema.animeEpisode.id))
      .where(eq(schema.animeEpisode.id, id))
      .limit(1)
    if (!row) throw new ORPCError('NOT_FOUND', { message: 'Episode not found' })
    const [episode] = await this.decorateEpisodes([row])
    if (!episode) {
      throw new ORPCError('NOT_FOUND', { message: 'Episode not found' })
    }
    return episode
  }

  private async decorateEpisodes(rows: EpisodeRow[]): Promise<AnimeEpisode[]> {
    if (rows.length === 0) return []
    const documents = await entityHandler('animeEpisode').serializeMany(
      this.db,
      rows.map((row) => row.id),
    )
    return rows.flatMap((row) => {
      const document = documents.get(row.id) as AnimeEpisodeDocument | undefined
      if (!document) return []
      const preferred = preferredLocalized(document.translations)
      return [
        {
          id: row.id,
          ...document,
          title: preferred,
          overview: preferred?.overview ?? null,
          headRev: row.headRev,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
      ]
    })
  }

  async createEpisodeForAnime(
    input: CreateAnimeEpisodeForAnimeInput,
    editorId: string,
  ): Promise<AnimeEpisode> {
    return this.createEpisode(
      input,
      { animeId: input.animeId, seasonId: null },
      editorId,
    )
  }

  async createEpisodeForSeason(
    input: CreateAnimeEpisodeForSeasonInput,
    editorId: string,
  ): Promise<AnimeEpisode> {
    return this.createEpisode(
      input,
      { animeId: null, seasonId: input.seasonId },
      editorId,
    )
  }

  private async nextPosition(
    tx: Tx,
    table: typeof schema.animeSeason | typeof schema.animeEpisode,
    condition: ReturnType<typeof eq>,
  ): Promise<number> {
    const [row] = await tx
      .select({
        value: sql<number>`coalesce(max(${table.position}) + 1, 0)::int`,
      })
      .from(table)
      .where(condition)
    return row?.value ?? 0
  }

  private async nextAnimeChildPosition(
    tx: Tx,
    animeId: string,
  ): Promise<number> {
    const [seasons, episodes] = await Promise.all([
      tx
        .select({
          value: sql<number>`coalesce(max(${schema.animeSeason.position}) + 1, 0)::int`,
        })
        .from(schema.animeSeason)
        .where(eq(schema.animeSeason.animeId, animeId)),
      tx
        .select({
          value: sql<number>`coalesce(max(${schema.animeEpisode.position}) + 1, 0)::int`,
        })
        .from(schema.animeEpisode)
        .where(eq(schema.animeEpisode.animeId, animeId)),
    ])
    return Math.max(seasons[0]?.value ?? 0, episodes[0]?.value ?? 0)
  }

  private async createEpisode(
    input: CreateAnimeEpisodeForAnimeInput | CreateAnimeEpisodeForSeasonInput,
    owner:
      { animeId: string; seasonId: null } | { animeId: null; seasonId: string },
    editorId: string,
  ): Promise<AnimeEpisode> {
    const id = await this.db.transaction(async (tx) => {
      if (owner.animeId !== null) {
        await this.lockLiveEntity(tx, owner.animeId, 'anime')
      } else {
        await this.lockLiveEntity(tx, owner.seasonId, 'animeSeason')
      }
      const position =
        owner.animeId !== null
          ? await this.nextAnimeChildPosition(tx, owner.animeId)
          : await this.nextPosition(
              tx,
              schema.animeEpisode,
              eq(schema.animeEpisode.seasonId, owner.seasonId),
            )
      const { translations, ...fields } = input
      const document = entityHandler('animeEpisode').parseDocument({
        ...fields,
        ...owner,
        position,
        translations: translations ?? [],
      })
      const entityId = await this.revisions.createEntity(tx, {
        kind: 'animeEpisode',
      })
      await entityHandler('animeEpisode').apply(
        tx,
        'create',
        entityId,
        document,
        null,
      )
      await this.record(tx, 'animeEpisode', entityId, 'create', editorId)
      return entityId
    })
    return this.getEpisode(id)
  }

  async updateEpisode(
    input: UpdateAnimeEpisodeInput,
    editorId: string,
  ): Promise<AnimeEpisode> {
    const { id, ...values } = input
    const patch = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== undefined),
    )
    if (Object.keys(patch).length === 0) return this.getEpisode(id)
    await this.db.transaction(async (tx) => {
      await this.lockLiveEntity(tx, id, 'animeEpisode')
      const previous = await entityHandler('animeEpisode').serialize(tx, id)
      await entityHandler('animeEpisode').apply(
        tx,
        'update',
        id,
        patch,
        previous,
      )
      await this.record(tx, 'animeEpisode', id, 'update', editorId)
    })
    return this.getEpisode(id)
  }

  async removeEpisode(id: string, editorId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.lockLiveEntity(tx, id, 'animeEpisode')
      const previous = await entityHandler('animeEpisode').serialize(tx, id)
      await entityHandler('animeEpisode').apply(tx, 'delete', id, {}, previous)
      await tx
        .update(schema.entity)
        .set({ deletedAt: new Date() })
        .where(eq(schema.entity.id, id))
      await this.record(tx, 'animeEpisode', id, 'delete', editorId, previous)
    })
  }

  async reorderSeasons(input: ReorderAnimeSeasonsInput, editorId: string) {
    await this.reorder({
      kind: 'animeSeason',
      parent: { id: input.animeId, kind: 'anime' },
      input,
      editorId,
      summary: `Reorder seasons for anime ${input.animeId.slice(0, 8)}`,
      lockedRows: (tx) =>
        tx
          .select({ id: schema.animeSeason.id, headRev: schema.entity.headRev })
          .from(schema.animeSeason)
          .innerJoin(schema.entity, eq(schema.entity.id, schema.animeSeason.id))
          .where(eq(schema.animeSeason.animeId, input.animeId))
          .orderBy(
            asc(schema.animeSeason.position),
            asc(schema.animeSeason.id),
          ),
      belongs: (document) => document.animeId === input.animeId,
    })
    return this.listSeasons(input.animeId, MAX_ORDERED_ITEMS, undefined)
  }

  async reorderEpisodesForAnime(
    input: ReorderAnimeEpisodesForAnimeInput,
    editorId: string,
  ) {
    await this.reorder({
      kind: 'animeEpisode',
      parent: { id: input.animeId, kind: 'anime' },
      input,
      editorId,
      summary: `Reorder episodes for anime ${input.animeId.slice(0, 8)}`,
      lockedRows: (tx) =>
        tx
          .select({
            id: schema.animeEpisode.id,
            headRev: schema.entity.headRev,
          })
          .from(schema.animeEpisode)
          .innerJoin(
            schema.entity,
            eq(schema.entity.id, schema.animeEpisode.id),
          )
          .where(eq(schema.animeEpisode.animeId, input.animeId))
          .orderBy(
            asc(schema.animeEpisode.position),
            asc(schema.animeEpisode.id),
          ),
      belongs: (document) =>
        document.animeId === input.animeId && document.seasonId === null,
    })
    return this.listEpisodesForAnime(
      input.animeId,
      undefined,
      MAX_ORDERED_ITEMS,
      undefined,
    )
  }

  async reorderEpisodesForSeason(
    input: ReorderAnimeEpisodesForSeasonInput,
    editorId: string,
  ) {
    await this.reorder({
      kind: 'animeEpisode',
      parent: { id: input.seasonId, kind: 'animeSeason' },
      input,
      editorId,
      summary: `Reorder episodes for season ${input.seasonId.slice(0, 8)}`,
      lockedRows: (tx) =>
        tx
          .select({
            id: schema.animeEpisode.id,
            headRev: schema.entity.headRev,
          })
          .from(schema.animeEpisode)
          .innerJoin(
            schema.entity,
            eq(schema.entity.id, schema.animeEpisode.id),
          )
          .where(eq(schema.animeEpisode.seasonId, input.seasonId))
          .orderBy(
            asc(schema.animeEpisode.position),
            asc(schema.animeEpisode.id),
          ),
      belongs: (document) => document.seasonId === input.seasonId,
    })
    return this.listEpisodesForSeason(
      input.seasonId,
      MAX_ORDERED_ITEMS,
      undefined,
    )
  }

  private async reorder(options: {
    kind: 'animeSeason' | 'animeEpisode'
    parent: { id: string; kind: 'anime' | 'animeSeason' }
    input: { orderedIds: string[]; expectedOrderEtag: string }
    editorId: string
    summary: string
    lockedRows: (tx: Tx) => Promise<{ id: string; headRev: number }[]>
    belongs: (document: Record<string, unknown>) => boolean
  }): Promise<void> {
    const { input, kind } = options
    await this.applier.submitAndApply(
      options.editorId,
      options.summary,
      null,
      async (tx) => {
        await this.lockLiveEntity(tx, options.parent.id, options.parent.kind)
        const rows = await options.lockedRows(tx)
        const currentIds = rows.map((row) => row.id)
        assertOrderEtag(input.expectedOrderEtag, currentIds)
        assertOrderCovers(input.orderedIds, currentIds)
        const revById = new Map(rows.map((row) => [row.id, row.headRev]))
        const documents = await entityHandler(kind).serializeMany(
          tx,
          input.orderedIds,
        )
        return input.orderedIds.flatMap((id, position) => {
          const document = documents.get(id)
          if (!document || !options.belongs(document)) {
            throw new ORPCError('CONFLICT', {
              message: 'The collection changed during reorder',
            })
          }
          const baseRev = revById.get(id)
          if (baseRev === undefined) {
            throw new ORPCError('CONFLICT', {
              message: 'The collection changed during reorder',
            })
          }
          return document.position === position
            ? []
            : [
                {
                  entityKind: kind,
                  entityId: id,
                  op: 'update' as const,
                  baseRev,
                  payload: { position },
                  oldValues: { position: document.position },
                },
              ]
        })
      },
    )
  }
}
