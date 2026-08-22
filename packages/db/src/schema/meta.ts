import { pgTable, serial, text } from 'drizzle-orm/pg-core'
import { createdAt } from './_columns'

export const meta = pgTable('_meta', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  createdAt: createdAt(),
})
