import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import type { Tx } from './registry'

type ChangesetRow = typeof schema.changeset.$inferSelect

export function asDocument(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {}
}

export async function lockChangeset(
  tx: Tx,
  changesetId: string,
): Promise<ChangesetRow> {
  const [row] = await tx
    .select()
    .from(schema.changeset)
    .where(eq(schema.changeset.id, changesetId))
    .for('update')
  if (!row) {
    throw new ORPCError('NOT_FOUND', { message: 'Contribution not found' })
  }
  return row
}

export function assertPending(row: Pick<ChangesetRow, 'status'>): void {
  if (row.status !== 'pending') {
    throw new ORPCError('CONFLICT', {
      message: `Contribution is already ${row.status}`,
    })
  }
}

export async function lockPendingChangeset(
  tx: Tx,
  changesetId: string,
): Promise<ChangesetRow> {
  const row = await lockChangeset(tx, changesetId)
  assertPending(row)
  return row
}

export function assertOwnerOrAdmin(
  row: Pick<ChangesetRow, 'authorId'>,
  userId: string,
  isAdmin: boolean,
): void {
  if (row.authorId !== userId && !isAdmin) {
    throw new ORPCError('NOT_FOUND', { message: 'Contribution not found' })
  }
}
