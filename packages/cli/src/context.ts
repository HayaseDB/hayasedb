import { createDb, type Database } from '@hayasedb/db'
import { createAuth, type Auth } from '@hayasedb/auth'
import type { AuthEnv, DbEnv } from './env'

export async function withDb<T>(
  env: DbEnv,
  fn: (db: Database) => Promise<T>,
): Promise<T> {
  const { db, client } = createDb(env.DATABASE_URL, { max: 1 })
  try {
    return await fn(db)
  } finally {
    await client.end()
  }
}

export async function withAuth<T>(
  env: AuthEnv,
  fn: (auth: Auth, db: Database) => Promise<T>,
): Promise<T> {
  return withDb(env, (db) => {
    const auth = createAuth({
      db,
      secret: env.AUTH_SECRET,
      appURL: env.WEB_PUBLIC_URL,
      errorCallbackURL: `${env.WEB_PUBLIC_URL}/login`,
    })
    return fn(auth, db)
  })
}
