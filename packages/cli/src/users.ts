import { eq } from 'drizzle-orm'
import { schema, type Database } from '@hayasedb/db'
import type { Auth } from '@hayasedb/auth'
import { CliError, EXIT_USAGE } from './tui'

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
  if (!user) throw new CliError(`No user found with email ${email}.`)
  return user
}

export function resolveRole(args: {
  role?: string
  admin?: boolean
}): string | undefined {
  if (!args.admin) return args.role
  if (args.role !== undefined && args.role !== 'admin') {
    throw new CliError(
      `--admin conflicts with --role ${args.role}.`,
      EXIT_USAGE,
    )
  }
  return 'admin'
}

export interface NewUser {
  email: string
  name: string
  password: string
  role: UserRole
}

export async function createVerifiedUser(
  auth: Auth,
  db: Database,
  user: NewUser,
): Promise<string> {
  const created = await auth.api.createUser({
    body: {
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
    },
  })

  await db
    .update(schema.user)
    .set({ emailVerified: true })
    .where(eq(schema.user.id, created.user.id))

  return created.user.id
}

export function describeCreatedUser(role: string, email: string): string {
  return role === 'admin'
    ? `Created admin user ${email}.`
    : `Created user ${email}.`
}
