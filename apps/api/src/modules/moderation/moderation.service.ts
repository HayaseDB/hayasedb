import { Inject, Injectable } from '@nestjs/common'
import { ORPCError } from '@orpc/server'
import { eq, sql } from 'drizzle-orm'
import type { ChangesetDetail, ChangesetStatus } from '@hayasedb/contract'
import { type Database, schema } from '@hayasedb/db'
import { DRIZZLE } from '../../database/database.constants'
import { ChangesetDetailService } from '../contribution/changeset-detail.service'
import { ChangesetApplyService } from '../revision/changeset-apply.service'
import { lockPendingChangeset } from '../revision/changeset-guards'
import { RevisionService } from '../revision/revision.service'

@Injectable()
export class ModerationService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly details: ChangesetDetailService,
    private readonly applier: ChangesetApplyService,
    private readonly revisions: RevisionService,
  ) {}

  async listChangesets(input: {
    status?: ChangesetStatus
    authorId?: string
    limit: number
    offset: number
  }) {
    return this.details.listChangesets(input)
  }

  async counts(): Promise<{ pending: number }> {
    const [row] = await this.db
      .select({ pending: sql<number>`count(*)::int` })
      .from(schema.changeset)
      .where(eq(schema.changeset.status, 'pending'))
    return { pending: row?.pending ?? 0 }
  }

  async getChangeset(id: string): Promise<ChangesetDetail> {
    await this.details.getChangesetRow(id)
    return this.details.buildDetail(id)
  }

  async approve(id: string, adminId: string): Promise<ChangesetDetail> {
    await this.applier.apply(id, adminId)
    return this.details.buildDetail(id)
  }

  async reject(
    id: string,
    reason: string,
    adminId: string,
  ): Promise<ChangesetDetail> {
    await this.db.transaction(async (tx) => {
      await lockPendingChangeset(tx, id)
      await tx
        .update(schema.changeset)
        .set({
          status: 'rejected',
          decidedAt: new Date(),
          decidedById: adminId,
        })
        .where(eq(schema.changeset.id, id))
      await tx.insert(schema.changesetMessage).values({
        changesetId: id,
        authorId: adminId,
        kind: 'rejection',
        body: reason,
      })
    })
    return this.details.buildDetail(id)
  }

  async revertChangeset(
    id: string,
    adminId: string,
    summary?: string,
  ): Promise<ChangesetDetail> {
    const { changesetId } = await this.applier.revertChangeset(
      id,
      adminId,
      summary,
    )
    return this.details.buildDetail(changesetId)
  }

  async revertToRevision(
    revisionId: string,
    adminId: string,
  ): Promise<ChangesetDetail> {
    const revision = await this.revisions.findRevisionById(revisionId)
    if (!revision) {
      throw new ORPCError('NOT_FOUND', { message: 'Revision not found' })
    }
    const { changesetId } = await this.applier.revertToRevision(
      revision.entityId,
      revision.rev,
      adminId,
    )
    return this.details.buildDetail(changesetId)
  }
}
