import type { Database } from '@hayasedb/db'
import type { ChangeOp, EntityKind } from '@hayasedb/domain'

export type Tx =
  Database | Parameters<Parameters<Database['transaction']>[0]>[0]

export interface EntityKindHandler<
  Doc extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly kind: EntityKind

  parseDocument(payload: unknown): Doc

  parsePatch(payload: unknown): Partial<Doc>

  serialize(tx: Tx, entityId: string): Promise<Doc>

  serializeMany(tx: Tx, entityIds: string[]): Promise<Map<string, Doc>>

  label(doc: Record<string, unknown>): string

  readonly labelFields: readonly string[]

  readonly mediaLinkTable?: {
    readonly table: string
    readonly mediaIdColumn: string
  }

  validateRefs(
    tx: Tx,
    payload: Record<string, unknown>,
    siblingCreates: ReadonlySet<string>,
  ): Promise<string[]>

  checkUniqueness(
    tx: Tx,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<string | null>

  apply(
    tx: Tx,
    op: ChangeOp,
    entityId: string,
    payload: Record<string, unknown>,
    prevDoc: Doc | null,
  ): Promise<void>
}
