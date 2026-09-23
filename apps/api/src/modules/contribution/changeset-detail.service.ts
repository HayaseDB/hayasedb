import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { and, asc, desc, eq, exists, inArray, sql, type SQL } from 'drizzle-orm'
import {
  genreDocumentSchema,
  type ChangeDetail,
  type ChangeParent,
  type ChangesetAuthor,
  type ChangesetDetail,
  type ChangesetListItem,
  type ChangesetStatus,
} from '@hayasedb/contract'
import { formatEpisodeNumber, type EntityKind } from '@hayasedb/domain'
import { type Database, schema } from '@hayasedb/db'
import { DRIZZLE } from '../../database/database.constants'
import { preferredLocalized } from '../localization'
import { pickDocumentKeys, type KindedDocument } from '../revision/diff'
import { DisplayService } from '../revision/display.service'
import { entityHandler } from '../revision/registry'
import { NULL_AUTHOR, UserRefService } from '../user/user-ref.service'

type ChangeRow = typeof schema.change.$inferSelect
type ChangesetRow = typeof schema.changeset.$inferSelect
type EntityRow = typeof schema.entity.$inferSelect

function asDocument(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

@Injectable()
export class ChangesetDetailService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly display: DisplayService,
    private readonly users: UserRefService,
  ) {}

  async getChangesetRow(id: string): Promise<ChangesetRow> {
    const [row] = await this.db
      .select()
      .from(schema.changeset)
      .where(eq(schema.changeset.id, id))
      .limit(1)
    if (!row) {
      throw new ORPCError('NOT_FOUND', { message: 'Contribution not found' })
    }
    return row
  }

  async listChangesets(filter: {
    authorId?: string
    status?: ChangesetStatus
    entityId?: string
    entityKind?: EntityKind
    limit: number
    offset: number
  }): Promise<{
    items: ChangesetListItem[]
    meta: { total: number; limit: number; offset: number }
  }> {
    const conditions: SQL[] = []
    if (filter.authorId) {
      conditions.push(eq(schema.changeset.authorId, filter.authorId))
    }
    if (filter.status) {
      conditions.push(eq(schema.changeset.status, filter.status))
    }
    if (filter.entityId || filter.entityKind) {
      const touchesEntity: SQL[] = [
        eq(schema.change.changesetId, schema.changeset.id),
      ]
      if (filter.entityId) {
        touchesEntity.push(eq(schema.change.entityId, filter.entityId))
      }
      if (filter.entityKind) {
        touchesEntity.push(eq(schema.change.entityKind, filter.entityKind))
      }
      conditions.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(schema.change)
            .where(and(...touchesEntity)),
        ),
      )
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [[countRow], rows] = await Promise.all([
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.changeset)
        .where(where),
      this.db
        .select()
        .from(schema.changeset)
        .where(where)
        .orderBy(
          desc(
            sql`coalesce(${schema.changeset.submittedAt}, ${schema.changeset.createdAt})`,
          ),
        )
        .limit(filter.limit)
        .offset(filter.offset),
    ])

    const changesetIds = rows.map((row) => row.id)
    const changes =
      changesetIds.length > 0
        ? await this.db
            .select()
            .from(schema.change)
            .where(inArray(schema.change.changesetId, changesetIds))
            .orderBy(asc(schema.change.ord))
        : []
    const changesByChangeset = new Map<string, ChangeRow[]>()
    for (const change of changes) {
      const list = changesByChangeset.get(change.changesetId) ?? []
      list.push(change)
      changesByChangeset.set(change.changesetId, list)
    }

    const authors = await this.users.loadAuthors(
      rows.map((row) => row.authorId),
    )

    return {
      items: rows.map((row) => {
        const rowChanges = changesByChangeset.get(row.id) ?? []
        return this.toListItem(row, rowChanges, authors, filter.entityId)
      }),
      meta: {
        total: countRow?.total ?? 0,
        limit: filter.limit,
        offset: filter.offset,
      },
    }
  }

  async buildDetail(changesetId: string): Promise<ChangesetDetail> {
    const row = await this.getChangesetRow(changesetId)

    const [changes, messages, [supersededBy], [revertedBy]] = await Promise.all(
      [
        this.db
          .select()
          .from(schema.change)
          .where(eq(schema.change.changesetId, changesetId))
          .orderBy(asc(schema.change.ord)),
        this.db
          .select()
          .from(schema.changesetMessage)
          .where(eq(schema.changesetMessage.changesetId, changesetId))
          .orderBy(asc(schema.changesetMessage.createdAt)),
        this.db
          .select({ id: schema.changeset.id })
          .from(schema.changeset)
          .where(eq(schema.changeset.supersedesId, changesetId))
          .orderBy(desc(schema.changeset.createdAt))
          .limit(1),
        this.db
          .select({
            id: schema.changeset.id,
            authorId: schema.changeset.authorId,
            decidedAt: schema.changeset.decidedAt,
            createdAt: schema.changeset.createdAt,
          })
          .from(schema.changeset)
          .where(
            and(
              eq(schema.changeset.revertsId, changesetId),
              eq(schema.changeset.status, 'approved'),
            ),
          )
          .orderBy(desc(schema.changeset.createdAt))
          .limit(1),
      ],
    )

    const entityIds = changes.map((change) => change.entityId)
    const entities =
      entityIds.length > 0
        ? await this.db
            .select()
            .from(schema.entity)
            .where(inArray(schema.entity.id, entityIds))
        : []
    const entityById = new Map(entities.map((entity) => [entity.id, entity]))

    const headDocs = await this.loadHeadDocuments(changes, entityById)

    const changeDetails: ChangeDetail[] = []
    const displayDocuments: KindedDocument[] = []
    const parents: Record<string, ChangeParent> = {}
    for (const change of changes) {
      const payload = asDocument(change.payload)
      const oldValues = change.oldValues ? asDocument(change.oldValues) : null
      const entity = entityById.get(change.entityId)

      let currentValues: Record<string, unknown> | null = null
      if (entity && !entity.deletedAt && change.op !== 'create') {
        const headDoc = headDocs.get(change.entityId)
        if (headDoc) {
          currentValues = pickDocumentKeys(headDoc, Object.keys(payload))
        }
      }

      for (const doc of [payload, oldValues, currentValues]) {
        displayDocuments.push({ kind: change.entityKind, doc })
      }

      const parent = this.changeParent(
        change,
        payload,
        headDocs.get(change.entityId) ?? oldValues,
      )
      if (parent) {
        parents[change.id] = parent
        if (parent.animeId) {
          displayDocuments.push({
            kind: change.entityKind,
            doc: { animeId: parent.animeId },
          })
        }
        if (parent.seasonId) {
          displayDocuments.push({
            kind: 'animeEpisode',
            doc: { seasonId: parent.seasonId },
          })
        }
      }
      changeDetails.push({
        id: change.id,
        ord: change.ord,
        entityKind: change.entityKind,
        entityId: change.entityId,
        op: change.op,
        baseRev: change.baseRev,
        payload,
        oldValues,
        currentValues,
        headRev: entity?.headRev ?? null,
        conflicted: change.conflicted,
        appliedRevisionId: change.appliedRevisionId,
      })
    }

    await this.resolveSeasonAnime(parents, changes, headDocs)

    const contexts = await this.loadAnimeContexts(parents, changes, headDocs)

    const authors = await this.users.loadAuthors([
      row.authorId,
      row.decidedById,
      revertedBy?.authorId ?? null,
      ...messages.map((message) => message.authorId),
    ])

    return {
      ...this.toListItem(row, changes, authors),
      decidedBy: row.decidedById
        ? (authors.get(row.decidedById) ?? NULL_AUTHOR)
        : null,
      supersedesId: row.supersedesId,
      supersededById: supersededBy?.id ?? null,
      revertsId: row.revertsId,
      revertedBy: revertedBy
        ? {
            changesetId: revertedBy.id,
            actor: revertedBy.authorId
              ? (authors.get(revertedBy.authorId) ?? NULL_AUTHOR)
              : NULL_AUTHOR,
            at: revertedBy.decidedAt ?? revertedBy.createdAt,
          }
        : null,
      changes: changeDetails,
      messages: messages.map((message) => ({
        id: message.id,
        author: message.authorId
          ? (authors.get(message.authorId) ?? NULL_AUTHOR)
          : NULL_AUTHOR,
        kind: message.kind,
        body: message.body,
        createdAt: message.createdAt,
      })),
      display: {
        ...this.overlayPendingGenreLabels(
          await this.display.buildDisplay([
            ...displayDocuments,
            ...Object.values(parents).map((parent) => ({
              kind: 'animeSeason' as const,
              doc: { animeId: parent.animeId },
            })),
          ]),
          changes,
        ),
        parents,
        contexts,
      },
    }
  }

  private async loadAnimeContexts(
    parents: Record<string, ChangeParent>,
    changes: ChangeRow[],
    headDocs: Map<string, Record<string, unknown>>,
  ): Promise<Record<string, Record<string, unknown>>> {
    const edited = new Set(
      changes
        .filter((change) => change.op === 'create')
        .map((change) => change.entityId),
    )
    const wanted = new Map<string, EntityKind>()
    for (const parent of Object.values(parents)) {
      if (parent.animeId && !edited.has(parent.animeId)) {
        wanted.set(parent.animeId, 'anime')
      }
      if (parent.seasonId && !edited.has(parent.seasonId)) {
        wanted.set(parent.seasonId, 'animeSeason')
      }
    }
    if (wanted.size === 0) return {}

    const contexts: Record<string, Record<string, unknown>> = {}
    const missingByKind = new Map<EntityKind, string[]>()
    for (const [id, kind] of wanted) {
      const doc = headDocs.get(id)
      if (doc) {
        contexts[id] = doc
        continue
      }
      const ids = missingByKind.get(kind) ?? []
      ids.push(id)
      missingByKind.set(kind, ids)
    }

    const batches = await Promise.all(
      [...missingByKind].map(([kind, ids]) =>
        entityHandler(kind).serializeMany(this.db, ids),
      ),
    )
    for (const batch of batches) {
      for (const [entityId, doc] of batch) contexts[entityId] = doc
    }
    return contexts
  }

  private async resolveSeasonAnime(
    parents: Record<string, ChangeParent>,
    changes: ChangeRow[],
    headDocs: Map<string, Record<string, unknown>>,
  ): Promise<void> {
    const pending = Object.values(parents).filter(
      (parent) => !parent.animeId && parent.seasonId,
    )
    if (pending.length === 0) return

    const seasonIds = [...new Set(pending.map((parent) => parent.seasonId!))]
    const known = new Map<string, string>()

    for (const change of changes) {
      if (change.entityKind !== 'animeSeason') continue
      const doc = {
        ...(headDocs.get(change.entityId) ?? {}),
        ...asDocument(change.payload),
      }
      const animeId = doc.animeId
      if (typeof animeId === 'string') known.set(change.entityId, animeId)
    }

    const missing = seasonIds.filter((id) => !known.has(id))
    if (missing.length > 0) {
      const rows = await this.db
        .select({
          id: schema.animeSeason.id,
          animeId: schema.animeSeason.animeId,
        })
        .from(schema.animeSeason)
        .where(inArray(schema.animeSeason.id, missing))
      for (const row of rows) known.set(row.id, row.animeId)
    }

    for (const parent of pending) {
      parent.animeId = known.get(parent.seasonId!) ?? null
    }
  }

  private changeParent(
    change: ChangeRow,
    payload: Record<string, unknown>,
    fallback: Record<string, unknown> | null,
  ): ChangeParent | null {
    if (change.entityKind === 'anime') {
      return { animeId: change.entityId, seasonId: null, label: null }
    }
    if (
      change.entityKind !== 'animeSeason' &&
      change.entityKind !== 'animeEpisode'
    ) {
      return null
    }

    const read = (key: string): string | null => {
      const value = payload[key] ?? fallback?.[key]
      return typeof value === 'string' ? value : null
    }

    return {
      animeId: read('animeId'),
      seasonId: change.entityKind === 'animeEpisode' ? read('seasonId') : null,
      label: this.entityLabel(change.entityKind, payload, fallback),
    }
  }

  private entityLabel(
    kind: EntityKind,
    payload: Record<string, unknown>,
    fallback: Record<string, unknown> | null,
  ): string | null {
    const source = { ...(fallback ?? {}), ...payload }
    const translations = source.translations
    if (Array.isArray(translations)) {
      const preferred = preferredLocalized(
        translations as { locale: string; original?: boolean }[],
      )
      const title = (preferred as { title?: unknown } | undefined)?.title
      if (typeof title === 'string' && title.length > 0) return title
    }

    const number = source.number
    if (typeof number === 'string' || typeof number === 'number') {
      const formatted = formatEpisodeNumber(number)
      if (formatted) {
        return kind === 'animeSeason'
          ? `Season ${formatted}`
          : `Episode ${formatted}`
      }
    }
    return null
  }

  private overlayPendingGenreLabels(
    display: ChangesetDetail['display'],
    changes: ChangeRow[],
  ): ChangesetDetail['display'] {
    const pending: Record<string, string> = {}
    for (const change of changes) {
      if (change.entityKind !== 'genre' || change.op !== 'create') continue
      const parsed = genreDocumentSchema.safeParse(change.payload)
      if (!parsed.success) continue
      const preferred = preferredLocalized(parsed.data.translations)
      if (preferred) pending[change.entityId] = preferred.name
    }
    if (Object.keys(pending).length === 0) return display
    return {
      ...display,
      refs: {
        ...display.refs,
        genre: { ...pending, ...display.refs.genre },
      },
    }
  }

  private async loadHeadDocuments(
    changes: ChangeRow[],
    entityById: Map<string, EntityRow>,
  ): Promise<Map<string, Record<string, unknown>>> {
    const idsByKind = new Map<EntityKind, string[]>()
    for (const change of changes) {
      const entity = entityById.get(change.entityId)
      if (!entity || entity.deletedAt || change.op === 'create') continue
      const ids = idsByKind.get(change.entityKind) ?? []
      ids.push(change.entityId)
      idsByKind.set(change.entityKind, ids)
    }

    const batches = await Promise.all(
      [...idsByKind].map(([kind, ids]) =>
        entityHandler(kind).serializeMany(this.db, ids),
      ),
    )

    const headDocs = new Map<string, Record<string, unknown>>()
    for (const batch of batches) {
      for (const [entityId, doc] of batch) headDocs.set(entityId, doc)
    }
    return headDocs
  }

  private toListItem(
    row: ChangesetRow,
    changes: ChangeRow[],
    authors: Map<string, ChangesetAuthor>,
    entityId?: string,
  ): ChangesetListItem {
    const scoped = entityId
      ? changes.find((change) => change.entityId === entityId)
      : undefined
    return {
      id: row.id,
      status: row.status,
      summary: row.summary,
      author: row.authorId
        ? (authors.get(row.authorId) ?? NULL_AUTHOR)
        : NULL_AUTHOR,
      changeCount: changes.length,
      entityKinds: changes.map((change) => change.entityKind),
      baseRev: scoped?.baseRev ?? null,
      submittedAt: row.submittedAt,
      decidedAt: row.decidedAt,
      createdAt: row.createdAt,
    }
  }
}
