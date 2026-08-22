import { sql } from 'drizzle-orm'
import { timestamp, uuid } from 'drizzle-orm/pg-core'

export const uuidV7Pk = () =>
  uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`)

export const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true })

export const createdAt = () => timestamptz('created_at').defaultNow().notNull()

export const updatedAt = () =>
  timestamptz('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull()

export const timestamps = () => ({
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})
