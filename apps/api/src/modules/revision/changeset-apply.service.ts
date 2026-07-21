import { Inject, Injectable, Logger } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { and, asc, eq, gt, inArray } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import type { ChangeOp, EntityKind } from '@hayasedb/domain'
import { DRIZZLE } from '../../database/database.constants'
import {
  asDocument,
  lockChangeset,
  lockPendingChangeset,
} from './changeset-guards'
import { entityHandler, type Tx } from './registry'
import { RevisionService } from './revision.service'

export type ApplyResult =
  { result: 'applied' } | { result: 'conflict'; messages: string[] }

interface RevertChangeDraft {
  entityKind: EntityKind
  entityId: string
  op: ChangeOp
  baseRev: number | null
  payload: Record<string, unknown>
}

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error
  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (
      typeof current === 'object' &&
      'code' in current &&
      (current as { code?: unknown }).code === '23505'
    ) {
      return true
    }
    current = (current as { cause?: unknown }).cause
  }
  return false
}

@Injectable()
export class ChangesetApplyService {
  private readonly logger = new Logger(ChangesetApplyService.name)

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly revisions: RevisionService,
  ) {}

  async apply(changesetId: string, decidedById: string): Promise<ApplyResult> {
    return this.withUniqueViolationBackstop(
      () => changesetId,
      decidedById,
      () =>
        this.db.transaction((tx) =>
          this.applyInTx(tx, changesetId, decidedById),
        ),
    )
  }

  private async applyInTx(
    tx: Tx,
    changesetId: string,
    decidedById: string,
  ): Promise<ApplyResult> {
    const cs = await lockPendingChangeset(tx, changesetId)

    const changes = await tx
      .select()
      .from(schema.change)
      .where(eq(schema.change.changesetId, changesetId))
      .orderBy(asc(schema.change.ord))

    const targetIds = [...changes.map((c) => c.entityId)].sort()
    const entities =
      targetIds.length > 0
        ? await tx
            .select()
            .from(schema.entity)
            .where(inArray(schema.entity.id, targetIds))
            .for('update')
        : []
    const entityById = new Map(entities.map((e) => [e.id, e]))

    const conflicts: { changeId: string; message: string }[] = []
    const siblingCreates: ReadonlySet<string> = new Set(
      changes.filter((c) => c.op === 'create').map((c) => c.entityId),
    )

    for (const change of changes) {
      const handler = entityHandler(change.entityKind)
      const payload = asDocument(change.payload)
      const existing = entityById.get(change.entityId)
      const label = handler.label(
        Object.keys(payload).length > 0
          ? payload
          : asDocument(change.oldValues),
      )

      if (existing && existing.kind !== change.entityKind) {
        conflicts.push({
          changeId: change.id,
          message: `${label}: entity kind mismatch`,
        })
        continue
      }

      if (change.op === 'create') {
        if (existing && !existing.deletedAt) {
          conflicts.push({
            changeId: change.id,
            message: `${label}: entity already exists`,
          })
        } else {
          const uniq = await handler.checkUniqueness(
            tx,
            change.entityId,
            payload,
          )
          if (uniq) conflicts.push({ changeId: change.id, message: uniq })
        }
      } else {
        if (!existing || (existing.deletedAt && change.op === 'update')) {
          conflicts.push({
            changeId: change.id,
            message: `${label}: entity is missing or deleted`,
          })
          continue
        }
        if (change.baseRev !== null && existing.headRev !== change.baseRev) {
          if (change.op === 'delete') {
            conflicts.push({
              changeId: change.id,
              message: `${label}: entity changed since submission`,
            })
          } else {
            const intervening = await tx
              .select({
                changedFields: schema.entityRevision.changedFields,
              })
              .from(schema.entityRevision)
              .where(
                and(
                  eq(schema.entityRevision.entityId, change.entityId),
                  gt(schema.entityRevision.rev, change.baseRev),
                ),
              )
            const touched = new Set(intervening.flatMap((r) => r.changedFields))
            const overlap = Object.keys(payload).filter((key) =>
              touched.has(key),
            )
            if (overlap.length > 0) {
              conflicts.push({
                changeId: change.id,
                message: `${label}: conflicting fields: ${overlap.join(', ')}`,
              })
            }
          }
        }
        if (change.op === 'update') {
          const uniq = await handler.checkUniqueness(
            tx,
            change.entityId,
            payload,
          )
          if (uniq) conflicts.push({ changeId: change.id, message: uniq })
        }
      }

      const refProblems = await handler.validateRefs(
        tx,
        payload,
        siblingCreates,
      )
      for (const problem of refProblems) {
        conflicts.push({
          changeId: change.id,
          message: `${label}: ${problem}`,
        })
      }
    }

    if (conflicts.length > 0) {
      const conflictedIds = [...new Set(conflicts.map((c) => c.changeId))]
      await tx
        .update(schema.change)
        .set({ conflicted: true })
        .where(inArray(schema.change.id, conflictedIds))
      const cleanIds = changes
        .map((c) => c.id)
        .filter((id) => !conflictedIds.includes(id))
      if (cleanIds.length > 0) {
        await tx
          .update(schema.change)
          .set({ conflicted: false })
          .where(
            and(
              inArray(schema.change.id, cleanIds),
              eq(schema.change.conflicted, true),
            ),
          )
      }
      const messages = conflicts.map((c) => c.message)
      await tx.insert(schema.changesetMessage).values({
        changesetId,
        authorId: decidedById,
        kind: 'system',
        body: `Approval blocked by conflicts:\n${messages
          .map((m) => `- ${m}`)
          .join('\n')}`,
      })
      return { result: 'conflict', messages }
    }

    for (const change of changes) {
      const handler = entityHandler(change.entityKind)
      const payload = (change.payload ?? {}) as Record<string, unknown>
      let document: Record<string, unknown>

      if (change.op === 'create') {
        await tx
          .insert(schema.entity)
          .values({ id: change.entityId, kind: change.entityKind })
          .onConflictDoUpdate({
            target: schema.entity.id,
            set: { deletedAt: null },
          })
        await handler.apply(tx, 'create', change.entityId, payload, null)
        document = await handler.serialize(tx, change.entityId)
      } else if (change.op === 'update') {
        const prevDoc = await handler.serialize(tx, change.entityId)
        await handler.apply(tx, 'update', change.entityId, payload, prevDoc)
        document = await handler.serialize(tx, change.entityId)
      } else {
        const prevDoc = await handler.serialize(tx, change.entityId)
        await handler.apply(tx, 'delete', change.entityId, {}, prevDoc)
        await tx
          .update(schema.entity)
          .set({ deletedAt: new Date() })
          .where(eq(schema.entity.id, change.entityId))
        document = prevDoc
      }

      const revision = await this.revisions.record(tx, {
        entityId: change.entityId,
        op: change.op,
        editorId: cs.authorId,
        changesetId: cs.id,
        document,
      })
      await tx
        .update(schema.change)
        .set({ appliedRevisionId: revision.id, conflicted: false })
        .where(eq(schema.change.id, change.id))
    }

    await tx
      .update(schema.changeset)
      .set({ status: 'approved', decidedAt: new Date(), decidedById })
      .where(eq(schema.changeset.id, cs.id))
    return { result: 'applied' }
  }

  private async withUniqueViolationBackstop(
    changesetId: () => string,
    decidedById: string,
    attempt: () => Promise<ApplyResult>,
  ): Promise<ApplyResult> {
    try {
      return await attempt()
    } catch (error) {
      if (!isUniqueViolation(error)) throw error

      const id = changesetId()
      this.logger.warn(
        `Unique violation while applying changeset ${id || '(rolled back)'}`,
      )
      const message =
        'A database constraint failed while applying (likely a concurrent duplicate value such as a slug). The changeset remains pending.'

      if (!id) {
        return {
          result: 'conflict',
          messages: [
            'A database constraint failed while applying (likely a concurrent duplicate value such as a slug). Nothing was changed.',
          ],
        }
      }

      await this.db.insert(schema.changesetMessage).values({
        changesetId: id,
        authorId: decidedById,
        kind: 'system',
        body: message,
      })
      return { result: 'conflict', messages: [message] }
    }
  }

  async revertChangeset(
    changesetId: string,
    adminId: string,
    summary?: string,
  ): Promise<{ changesetId: string; result: ApplyResult }> {
    return this.submitAndApply(
      adminId,
      summary ?? `Revert of changeset ${changesetId.slice(0, 8)}`,
      changesetId,
      async (tx) => {
        const cs = await lockChangeset(tx, changesetId)
        if (cs.status !== 'approved') {
          throw new ORPCError('CONFLICT', {
            message: 'Only applied changesets can be reverted',
          })
        }

        const changes = await tx
          .select()
          .from(schema.change)
          .where(eq(schema.change.changesetId, changesetId))
          .orderBy(asc(schema.change.ord))

        const drafts: RevertChangeDraft[] = []
        for (const change of [...changes].reverse()) {
          if (!change.appliedRevisionId) {
            throw new ORPCError('CONFLICT', {
              message: 'Changeset has changes without applied revisions',
            })
          }
          const appliedRevision = await this.revisions.findRevisionById(
            change.appliedRevisionId,
          )
          if (!appliedRevision) {
            throw new ORPCError('INTERNAL_SERVER_ERROR', {
              message: 'Applied revision is missing',
            })
          }
          const [entityRow] = await tx
            .select()
            .from(schema.entity)
            .where(eq(schema.entity.id, change.entityId))
            .limit(1)
          if (!entityRow) {
            throw new ORPCError('INTERNAL_SERVER_ERROR', {
              message: 'Entity supertable row is missing',
            })
          }

          if (change.op === 'create') {
            drafts.push({
              entityKind: change.entityKind,
              entityId: change.entityId,
              op: 'delete',
              baseRev: entityRow.headRev,
              payload: {},
            })
          } else if (change.op === 'update') {
            const previous = await this.revisions.findRevision(
              tx,
              change.entityId,
              appliedRevision.rev - 1,
            )
            if (!previous) {
              throw new ORPCError('INTERNAL_SERVER_ERROR', {
                message: 'Pre-change revision is missing',
              })
            }
            drafts.push({
              entityKind: change.entityKind,
              entityId: change.entityId,
              op: entityRow.deletedAt ? 'create' : 'update',
              baseRev: entityRow.deletedAt ? null : entityRow.headRev,
              payload: previous.snapshot,
            })
          } else {
            drafts.push({
              entityKind: change.entityKind,
              entityId: change.entityId,
              op: 'create',
              baseRev: null,
              payload: appliedRevision.snapshot,
            })
          }
        }
        return drafts
      },
    )
  }

  async revertToRevision(
    entityId: string,
    toRev: number,
    adminId: string,
  ): Promise<{ changesetId: string; result: ApplyResult }> {
    return this.submitAndApply(
      adminId,
      `Revert to revision ${toRev}`,
      null,
      async (tx) => {
        const [entityRow] = await tx
          .select()
          .from(schema.entity)
          .where(eq(schema.entity.id, entityId))
          .for('update')
        if (!entityRow) {
          throw new ORPCError('NOT_FOUND', { message: 'Entity not found' })
        }
        const target = await this.revisions.findRevision(tx, entityId, toRev)
        if (!target) {
          throw new ORPCError('NOT_FOUND', { message: 'Revision not found' })
        }

        if (target.op === 'delete') {
          if (entityRow.deletedAt) {
            throw new ORPCError('CONFLICT', {
              message: 'Entity is already deleted',
            })
          }
          return [
            {
              entityKind: entityRow.kind,
              entityId,
              op: 'delete',
              baseRev: entityRow.headRev,
              payload: {},
            },
          ]
        }
        return [
          {
            entityKind: entityRow.kind,
            entityId,
            op: entityRow.deletedAt ? 'create' : 'update',
            baseRev: entityRow.deletedAt ? null : entityRow.headRev,
            payload: target.snapshot,
          },
        ]
      },
    )
  }

  private async submitAndApply(
    adminId: string,
    summary: string,
    revertsId: string | null,
    prepare: (tx: Tx) => Promise<RevertChangeDraft[]>,
  ): Promise<{ changesetId: string; result: ApplyResult }> {
    let changesetId = ''
    let committed = false

    const result = await this.withUniqueViolationBackstop(
      () => (committed ? changesetId : ''),
      adminId,
      () =>
        this.db.transaction(async (tx) => {
          const drafts = await prepare(tx)

          const [cs] = await tx
            .insert(schema.changeset)
            .values({
              authorId: adminId,
              status: 'pending',
              summary,
              submittedAt: new Date(),
              revertsId,
            })
            .returning({ id: schema.changeset.id })
          changesetId = cs!.id

          await tx.insert(schema.change).values(
            drafts.map((draft, ord) => ({
              changesetId: cs!.id,
              ord,
              entityKind: draft.entityKind,
              entityId: draft.entityId,
              op: draft.op,
              baseRev: draft.baseRev,
              payload: draft.payload,
            })),
          )

          const applied = await this.applyInTx(tx, cs!.id, adminId)
          committed = true
          return applied
        }),
    )

    return { changesetId, result }
  }
}
