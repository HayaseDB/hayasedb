import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import type {
  ChangeDetail,
  ChangesetAuthor,
  ChangesetDetail,
  ChangesetListItem,
  ChangesetStatus,
} from '@hayasedb/contract'
import type { EntityKind } from '@hayasedb/domain'
import { type Database, schema } from '@hayasedb/db'
import { DRIZZLE } from '../../database/database.constants'
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

function changeLabel(change: ChangeRow): string {
  const handler = entityHandler(change.entityKind)
  return handler.label({
    ...asDocument(change.oldValues),
    ...asDocument(change.payload),
  })
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
        return this.toListItem(row, rowChanges, authors)
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
        entityLabel: changeLabel(change),
      })
    }

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
      display: await this.display.buildDisplay(displayDocuments),
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
  ): ChangesetListItem {
    return {
      id: row.id,
      status: row.status,
      summary: row.summary,
      author: row.authorId
        ? (authors.get(row.authorId) ?? NULL_AUTHOR)
        : NULL_AUTHOR,
      changeCount: changes.length,
      entityLabels: changes.map((change) => changeLabel(change)),
      submittedAt: row.submittedAt,
      decidedAt: row.decidedAt,
      createdAt: row.createdAt,
    }
  }
}
