import { relations } from 'drizzle-orm'
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const avatar = pgTable(
  'avatar',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    bucket: text('bucket').notNull(),
    key: text('key').notNull(),
    url: text('url').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    width: integer('width'),
    height: integer('height'),
    status: text('status').default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('avatar_userId_idx').on(table.userId)],
)

export const avatarRelations = relations(avatar, ({ one }) => ({
  user: one(user, {
    fields: [avatar.userId],
    references: [user.id],
  }),
}))
