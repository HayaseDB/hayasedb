import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const meta = pgTable('_meta', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
