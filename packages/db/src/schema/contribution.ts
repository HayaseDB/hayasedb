import {
  CHANGE_OPS,
  CHANGESET_STATUSES,
  ENTITY_KINDS,
  MESSAGE_KINDS,
} from '@hayasedb/domain'
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

const uuidV7Pk = () =>
  uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`)

export const entityKind = pgEnum('entity_kind', ENTITY_KINDS)

export const changesetStatus = pgEnum('changeset_status', CHANGESET_STATUSES)

export const changeOp = pgEnum('change_op', CHANGE_OPS)

export const changesetMessageKind = pgEnum(
  'changeset_message_kind',
  MESSAGE_KINDS,
)

export const entity = pgTable(
  'entity',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    kind: entityKind('kind').notNull(),
    headRev: integer('head_rev').default(0).notNull(),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('entity_kind_idx').on(table.kind)],
)

export const changeset = pgTable(
  'changeset',
  {
    id: uuidV7Pk(),
    authorId: text('author_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    status: changesetStatus('status').default('pending').notNull(),
    summary: text('summary').notNull(),
    submittedAt: timestamp('submitted_at'),
    decidedAt: timestamp('decided_at'),
    decidedById: text('decided_by_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    supersedesId: uuid('supersedes_id').references(
      (): AnyPgColumn => changeset.id,
    ),
    revertsId: uuid('reverts_id').references((): AnyPgColumn => changeset.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('changeset_pending_idx')
      .on(table.status, table.submittedAt)
      .where(sql`${table.status} = 'pending'`),
    index('changeset_author_idx').on(table.authorId, table.createdAt),
  ],
)

export const entityRevision = pgTable(
  'entity_revision',
  {
    id: uuidV7Pk(),
    entityId: uuid('entity_id')
      .notNull()
      .references(() => entity.id),
    rev: integer('rev').notNull(),
    op: changeOp('op').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    changedFields: text('changed_fields')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    changesetId: uuid('changeset_id').references(() => changeset.id),
    editorId: text('editor_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('entity_revision_entity_rev_uq').on(table.entityId, table.rev),
    index('entity_revision_changeset_idx').on(table.changesetId),
  ],
)

export const change = pgTable(
  'change',
  {
    id: uuidV7Pk(),
    changesetId: uuid('changeset_id')
      .notNull()
      .references(() => changeset.id, { onDelete: 'cascade' }),
    ord: smallint('ord').notNull(),
    entityKind: entityKind('entity_kind').notNull(),
    entityId: uuid('entity_id').notNull(),
    op: changeOp('op').notNull(),
    baseRev: integer('base_rev'),
    payload: jsonb('payload').notNull(),
    oldValues: jsonb('old_values'),
    conflicted: boolean('conflicted').default(false).notNull(),
    appliedRevisionId: uuid('applied_revision_id').references(
      () => entityRevision.id,
    ),
  },
  (table) => [
    uniqueIndex('change_changeset_entity_uq').on(
      table.changesetId,
      table.entityId,
    ),
    index('change_entity_idx').on(table.entityId),
  ],
)

export const changesetMessage = pgTable(
  'changeset_message',
  {
    id: uuidV7Pk(),
    changesetId: uuid('changeset_id')
      .notNull()
      .references(() => changeset.id, { onDelete: 'cascade' }),
    authorId: text('author_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    kind: changesetMessageKind('kind').default('comment').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('changeset_message_changeset_idx').on(
      table.changesetId,
      table.createdAt,
    ),
  ],
)

export const entityRelations = relations(entity, ({ many }) => ({
  revisions: many(entityRevision),
}))

export const changesetRelations = relations(changeset, ({ one, many }) => ({
  author: one(user, {
    fields: [changeset.authorId],
    references: [user.id],
    relationName: 'changesetAuthor',
  }),
  decidedBy: one(user, {
    fields: [changeset.decidedById],
    references: [user.id],
    relationName: 'changesetDecidedBy',
  }),
  supersedes: one(changeset, {
    fields: [changeset.supersedesId],
    references: [changeset.id],
  }),
  changes: many(change),
  messages: many(changesetMessage),
}))

export const entityRevisionRelations = relations(entityRevision, ({ one }) => ({
  entity: one(entity, {
    fields: [entityRevision.entityId],
    references: [entity.id],
  }),
  changeset: one(changeset, {
    fields: [entityRevision.changesetId],
    references: [changeset.id],
  }),
  editor: one(user, {
    fields: [entityRevision.editorId],
    references: [user.id],
  }),
}))

export const changeRelations = relations(change, ({ one }) => ({
  changeset: one(changeset, {
    fields: [change.changesetId],
    references: [changeset.id],
  }),
  appliedRevision: one(entityRevision, {
    fields: [change.appliedRevisionId],
    references: [entityRevision.id],
  }),
}))

export const changesetMessageRelations = relations(
  changesetMessage,
  ({ one }) => ({
    changeset: one(changeset, {
      fields: [changesetMessage.changesetId],
      references: [changeset.id],
    }),
    author: one(user, {
      fields: [changesetMessage.authorId],
      references: [user.id],
    }),
  }),
)
