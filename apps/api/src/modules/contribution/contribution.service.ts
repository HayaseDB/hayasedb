import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { and, eq, gt, sql } from 'drizzle-orm'
import type {
  ChangesetDetail,
  ChangesetNote,
  SubmitChangesetInput,
  UploadMediaOutput,
} from '@hayasedb/contract'
import { type Database, schema } from '@hayasedb/db'
import { isSupersedableStatus } from '@hayasedb/domain'
import { DRIZZLE } from '../../database/database.constants'
import { MediaService } from '../media/media.service'
import {
  assertOwnerOrAdmin,
  assertPending,
  lockChangeset,
} from '../revision/changeset-guards'
import { pickDocumentKeys } from '../revision/diff'
import { entityHandler, type Tx } from '../revision/registry'
import { UserRefService } from '../user/user-ref.service'
import { ChangesetDetailService } from './changeset-detail.service'

const MAX_PENDING_CHANGESETS_PER_AUTHOR = 10
const UPLOAD_DAILY_LIMIT = 100

@Injectable()
export class ContributionService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly media: MediaService,
    private readonly details: ChangesetDetailService,
    private readonly users: UserRefService,
  ) {}

  async uploadMedia(file: File, userId: string): Promise<UploadMediaOutput> {
    const [countRow] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.mediaUpload)
      .where(
        and(
          eq(schema.mediaUpload.uploaderId, userId),
          gt(schema.mediaUpload.createdAt, sql`now() - interval '24 hours'`),
        ),
      )
    if ((countRow?.total ?? 0) >= UPLOAD_DAILY_LIMIT) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Upload limit reached, try again later',
      })
    }

    const asset = await this.media.ingest(file, file.name)
    await this.db
      .insert(schema.mediaUpload)
      .values({ mediaAssetId: asset.id, uploaderId: userId })

    return {
      mediaId: asset.id,
      url: this.media.publicUrl(asset),
      blurhash: asset.blurhash,
      width: asset.width,
      height: asset.height,
    }
  }

  async submit(
    input: SubmitChangesetInput,
    userId: string,
  ): Promise<ChangesetDetail> {
    const [pendingRow] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(schema.changeset)
      .where(
        and(
          eq(schema.changeset.authorId, userId),
          eq(schema.changeset.status, 'pending'),
        ),
      )
    if ((pendingRow?.total ?? 0) >= MAX_PENDING_CHANGESETS_PER_AUTHOR) {
      throw new ORPCError('FORBIDDEN', {
        message:
          'You have too many pending contributions. Wait for review before submitting more.',
      })
    }

    const entityIds = input.changes.map((change) => change.entityId)
    if (new Set(entityIds).size !== entityIds.length) {
      throw new ORPCError('CONFLICT', {
        message: 'A changeset may only contain one change per entity',
      })
    }

    const changesetId = await this.db.transaction(async (tx) => {
      if (input.supersedesId) {
        await this.claimSuperseded(tx, input.supersedesId, userId)
      }

      const siblingCreates: ReadonlySet<string> = new Set(
        input.changes
          .filter((change) => change.op === 'create')
          .map((change) => change.entityId),
      )

      const changeRows: Array<typeof schema.change.$inferInsert> = []
      for (const [ord, change] of input.changes.entries()) {
        const handler = entityHandler(change.entityKind)
        const payload =
          change.op === 'delete'
            ? {}
            : (change.payload as Record<string, unknown>)

        const refProblems = await handler.validateRefs(
          tx,
          payload,
          siblingCreates,
        )
        if (refProblems.length > 0) {
          throw new ORPCError('NOT_FOUND', {
            message: refProblems.join('; '),
          })
        }

        let baseRev: number | null = null
        let oldValues: Record<string, unknown> | null = null

        if (change.op === 'create') {
          const [existing] = await tx
            .select({ id: schema.entity.id })
            .from(schema.entity)
            .where(eq(schema.entity.id, change.entityId))
            .limit(1)
          if (existing) {
            throw new ORPCError('CONFLICT', {
              message: 'An entity with this id already exists',
            })
          }
          const uniq = await handler.checkUniqueness(
            tx,
            change.entityId,
            payload,
          )
          if (uniq) throw new ORPCError('CONFLICT', { message: uniq })
        } else {
          const [entityRow] = await tx
            .select()
            .from(schema.entity)
            .where(eq(schema.entity.id, change.entityId))
            .limit(1)
          if (
            !entityRow ||
            entityRow.kind !== change.entityKind ||
            entityRow.deletedAt
          ) {
            throw new ORPCError('NOT_FOUND', {
              message: 'The entity you are editing no longer exists',
            })
          }
          if (change.baseRev > entityRow.headRev) {
            throw new ORPCError('CONFLICT', {
              message: 'Invalid base revision',
            })
          }
          baseRev = change.baseRev

          if (change.op === 'update') {
            const uniq = await handler.checkUniqueness(
              tx,
              change.entityId,
              payload,
            )
            if (uniq) throw new ORPCError('CONFLICT', { message: uniq })
          }

          const headDoc = await handler.serialize(tx, change.entityId)
          oldValues =
            change.op === 'delete'
              ? headDoc
              : pickDocumentKeys(headDoc, [
                  ...Object.keys(payload),
                  ...handler.labelFields,
                ])
        }

        changeRows.push({
          changesetId: '',
          ord,
          entityKind: change.entityKind,
          entityId: change.entityId,
          op: change.op,
          baseRev,
          payload,
          oldValues,
        })
      }

      const [cs] = await tx
        .insert(schema.changeset)
        .values({
          authorId: userId,
          status: 'pending',
          summary: input.summary,
          submittedAt: new Date(),
          supersedesId: input.supersedesId ?? null,
        })
        .returning({ id: schema.changeset.id })

      await tx
        .insert(schema.change)
        .values(changeRows.map((row) => ({ ...row, changesetId: cs!.id })))

      return cs!.id
    })

    return this.details.buildDetail(changesetId)
  }

  async listMine(
    userId: string,
    input: {
      status?: (typeof schema.changeset.$inferSelect)['status']
      limit: number
      offset: number
    },
  ) {
    return this.details.listChangesets({
      authorId: userId,
      status: input.status,
      limit: input.limit,
      offset: input.offset,
    })
  }

  async get(
    id: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<ChangesetDetail> {
    const row = await this.details.getChangesetRow(id)
    assertOwnerOrAdmin(row, userId, isAdmin)
    return this.details.buildDetail(id)
  }

  async withdraw(id: string, userId: string): Promise<ChangesetDetail> {
    await this.db.transaction(async (tx) => {
      const row = await lockChangeset(tx, id)
      assertOwnerOrAdmin(row, userId, false)
      assertPending(row)
      await tx
        .update(schema.changeset)
        .set({ status: 'withdrawn', decidedAt: new Date() })
        .where(eq(schema.changeset.id, id))
    })
    return this.details.buildDetail(id)
  }

  async addNote(
    id: string,
    userId: string,
    body: string,
    isAdmin: boolean,
  ): Promise<ChangesetNote> {
    const row = await this.details.getChangesetRow(id)
    assertOwnerOrAdmin(row, userId, isAdmin)
    const [[note], author] = await Promise.all([
      this.db
        .insert(schema.changesetNote)
        .values({ changesetId: id, authorId: userId, body })
        .returning(),
      this.users.loadAuthor(userId),
    ])
    return {
      id: note!.id,
      author,
      body: note!.body,
      createdAt: note!.createdAt,
    }
  }

  private async claimSuperseded(
    tx: Tx,
    supersedesId: string,
    userId: string,
  ): Promise<void> {
    const [row] = await tx
      .select()
      .from(schema.changeset)
      .where(eq(schema.changeset.id, supersedesId))
      .for('update')
    if (!row || row.authorId !== userId) {
      throw new ORPCError('NOT_FOUND', {
        message: 'The contribution you are revising was not found',
      })
    }
    if (!isSupersedableStatus(row.status)) {
      throw new ORPCError('CONFLICT', {
        message: `A ${row.status} contribution cannot be revised`,
      })
    }
    if (row.status === 'pending') {
      await tx
        .update(schema.changeset)
        .set({ status: 'superseded', decidedAt: new Date() })
        .where(eq(schema.changeset.id, supersedesId))
    }
  }
}
