import { eq } from 'drizzle-orm'
import { schema, type Database } from '@hayasedb/db'
import { consola } from 'consola'

export const USER_ROLES = ['user', 'admin'] as const
export type UserRole = (typeof USER_ROLES)[number]

export interface UserRow {
  id: string
  email: string
  role: string | null
}

export async function findUserByEmail(
  db: Database,
  email: string,
): Promise<UserRow | null> {
  const [row] = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      role: schema.user.role,
    })
    .from(schema.user)
    .where(eq(schema.user.email, email))
    .limit(1)
  return row ?? null
}

export async function requireUserByEmail(
  db: Database,
  email: string,
): Promise<UserRow> {
  const user = await findUserByEmail(db, email)
  if (!user) {
    consola.error(`No user found with email ${email}.`)
    process.exit(1)
  }
  return user
}
