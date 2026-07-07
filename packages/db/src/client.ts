import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

export interface DbOptions {
  max?: number
  idleTimeout?: number
  connectTimeout?: number
  maxLifetime?: number
  onError?: (error: Error) => void
}

export function createDb(url: string, options: DbOptions = {}) {
  const client = postgres(url, {
    max: options.max ?? 10,
    idle_timeout: options.idleTimeout ?? 30,
    connect_timeout: options.connectTimeout ?? 10,
    max_lifetime: options.maxLifetime ?? 60 * 30,
    onnotice: () => {},
  })

  if (options.onError) {
    const onError = options.onError
    void client`SELECT 1`.catch(onError)
  }

  const db = drizzle(client, { schema })
  return { db, client }
}

export type Database = ReturnType<typeof createDb>['db']
export type DbClient = ReturnType<typeof createDb>['client']
export { schema }
