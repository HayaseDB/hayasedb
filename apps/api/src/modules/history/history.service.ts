import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { eq, inArray } from 'drizzle-orm'
import type { RevisionDetail, RevisionListItem } from '@hayasedb/contract'
import { type Database, schema } from '@hayasedb/db'
import type { EntityKind } from '@hayasedb/domain'
import { DRIZZLE } from '../../database/database.constants'
import { DisplayService } from '../revision/display.service'
import { RevisionService, type RevisionRow } from '../revision/revision.service'
import { NULL_AUTHOR, UserRefService } from '../user/user-ref.service'

@Injectable()
export class HistoryService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly revisions: RevisionService,
    private readonly display: DisplayService,
    private readonly users: UserRefService,
  ) {}

  async listRevisions(input: {
    entityKind: EntityKind
    entityId: string
    limit: number
    offset: number
  }): Promise<{
    items: RevisionListItem[]
    meta: { total: number; limit: number; offset: number }
  }> {
    await this.revisions.assertEntityOfKind(input.entityId, input.entityKind)

    const { items, total } = await this.revisions.listRevisions(input)
    const decorated = await this.decorate(items)

    return {
      items: decorated,
      meta: { total, limit: input.limit, offset: input.offset },
    }
  }

  async getRevision(id: string): Promise<RevisionDetail> {
    const revision = await this.revisions.findRevisionById(id)
    if (!revision) {
      throw new ORPCError('NOT_FOUND', { message: 'Revision not found' })
    }
    const [entityRow] = await this.db
      .select({ kind: schema.entity.kind })
      .from(schema.entity)
      .where(eq(schema.entity.id, revision.entityId))
      .limit(1)
    if (!entityRow) {
      throw new ORPCError('NOT_FOUND', { message: 'Entity not found' })
    }

    const previous =
      revision.rev > 1
        ? await this.revisions.findRevision(
            this.db,
            revision.entityId,
            revision.rev - 1,
          )
        : null

    const [decorated] = await this.decorate([revision])

    return {
      ...decorated!,
      entityId: revision.entityId,
      entityKind: entityRow.kind,
      snapshot: revision.snapshot,
      previousSnapshot: previous?.snapshot ?? null,
      display: await this.display.buildDisplay([
        { kind: entityRow.kind, doc: revision.snapshot },
        { kind: entityRow.kind, doc: previous?.snapshot ?? null },
      ]),
    }
  }

  private async decorate(rows: RevisionRow[]): Promise<RevisionListItem[]> {
    const changesetIds = [
      ...new Set(
        rows
          .map((row) => row.changesetId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]

    const [editorById, changesets] = await Promise.all([
      this.users.loadAuthors(rows.map((row) => row.editorId)),
      changesetIds.length > 0
        ? this.db
            .select({
              id: schema.changeset.id,
              summary: schema.changeset.summary,
            })
            .from(schema.changeset)
            .where(inArray(schema.changeset.id, changesetIds))
        : Promise.resolve([]),
    ])

    const summaryById = new Map(changesets.map((row) => [row.id, row.summary]))

    return rows.map((row) => ({
      id: row.id,
      rev: row.rev,
      op: row.op,
      changedFields: row.changedFields,
      editor: row.editorId
        ? (editorById.get(row.editorId) ?? NULL_AUTHOR)
        : null,
      changesetId: row.changesetId,
      changesetSummary: row.changesetId
        ? (summaryById.get(row.changesetId) ?? null)
        : null,
      createdAt: row.createdAt,
    }))
  }
}
