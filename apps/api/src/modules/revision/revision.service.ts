import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import type { ChangeOp, EntityKind } from '@hayasedb/domain'
import { DRIZZLE } from '../../database/database.constants'
import { diffDocuments } from './diff'
import type { Tx } from './registry'

export interface RecordRevisionOptions {
  entityId: string
  op: ChangeOp
  editorId: string | null
  changesetId: string | null
  document: Record<string, unknown>
}

export interface RevisionRow {
  id: string
  entityId: string
  rev: number
  op: ChangeOp
  snapshot: Record<string, unknown>
  changedFields: string[]
  changesetId: string | null
  editorId: string | null
  createdAt: Date
}

@Injectable()
export class RevisionService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async assertEntityOfKind(entityId: string, kind: EntityKind): Promise<void> {
    const [row] = await this.db
      .select({ id: schema.entity.id })
      .from(schema.entity)
      .where(and(eq(schema.entity.id, entityId), eq(schema.entity.kind, kind)))
      .limit(1)
    if (!row) {
      throw new ORPCError('NOT_FOUND', { message: 'Entity not found' })
    }
  }

  async createEntity(
    tx: Tx,
    opts: { id?: string; kind: EntityKind },
  ): Promise<string> {
    const [row] = await tx
      .insert(schema.entity)
      .values(opts.id ? { id: opts.id, kind: opts.kind } : { kind: opts.kind })
      .returning({ id: schema.entity.id })
    return row!.id
  }

  async record(
    tx: Tx,
    opts: RecordRevisionOptions,
  ): Promise<{ id: string; rev: number }> {
    const [bumped] = await tx
      .update(schema.entity)
      .set({ headRev: sql`${schema.entity.headRev} + 1` })
      .where(eq(schema.entity.id, opts.entityId))
      .returning({ headRev: schema.entity.headRev })
    if (!bumped) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: `Entity ${opts.entityId} has no supertable row`,
      })
    }
    const rev = bumped.headRev

    const prev =
      rev > 1 ? await this.findRevision(tx, opts.entityId, rev - 1) : null
    const changedFields = diffDocuments(prev?.snapshot ?? null, opts.document)

    const [row] = await tx
      .insert(schema.entityRevision)
      .values({
        entityId: opts.entityId,
        rev,
        op: opts.op,
        snapshot: opts.document,
        changedFields,
        changesetId: opts.changesetId,
        editorId: opts.editorId,
      })
      .returning({ id: schema.entityRevision.id })

    return { id: row!.id, rev }
  }

  async findRevision(
    executor: Tx | Database,
    entityId: string,
    rev: number,
  ): Promise<RevisionRow | null> {
    const [row] = await executor
      .select()
      .from(schema.entityRevision)
      .where(
        and(
          eq(schema.entityRevision.entityId, entityId),
          eq(schema.entityRevision.rev, rev),
        ),
      )
      .limit(1)
    return row ? this.toRevisionRow(row) : null
  }

  async findRevisionById(id: string): Promise<RevisionRow | null> {
    const [row] = await this.db
      .select()
      .from(schema.entityRevision)
      .where(eq(schema.entityRevision.id, id))
      .limit(1)
    return row ? this.toRevisionRow(row) : null
  }

  async listRevisions(input: {
    entityId: string
    limit: number
    offset: number
  }): Promise<{ items: RevisionRow[]; total: number }> {
    const where = eq(schema.entityRevision.entityId, input.entityId)
    const [[countRow], rows] = await Promise.all([
      this.db
        .select({ total: sql<number>`count(*)::int` })
        .from(schema.entityRevision)
        .where(where),
      this.db
        .select()
        .from(schema.entityRevision)
        .where(where)
        .orderBy(desc(schema.entityRevision.rev))
        .limit(input.limit)
        .offset(input.offset),
    ])
    return {
      items: rows.map((row) => this.toRevisionRow(row)),
      total: countRow?.total ?? 0,
    }
  }

  private toRevisionRow(
    row: typeof schema.entityRevision.$inferSelect,
  ): RevisionRow {
    return {
      id: row.id,
      entityId: row.entityId,
      rev: row.rev,
      op: row.op,
      snapshot: row.snapshot as Record<string, unknown>,
      changedFields: row.changedFields,
      changesetId: row.changesetId,
      editorId: row.editorId,
      createdAt: row.createdAt,
    }
  }
}
