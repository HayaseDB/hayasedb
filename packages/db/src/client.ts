import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

export function createDb(url: string) {
  const client = postgres(url)
  const db = drizzle(client, { schema })
  return { db, client }
}

export type Database = ReturnType<typeof createDb>['db']
export type DbClient = ReturnType<typeof createDb>['client']
export { schema }
