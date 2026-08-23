import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { type Database, schema } from '@hayasedb/db'
import type { TestHttp } from './client'
import type { FakeMailer } from './fake-mailer'

export const PASSWORD = 'correct-horse-battery-staple'

export interface TestUser {
  id: string
  email: string
  name: string
  password: string
}

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@test.hayasedb.local`
}

export async function signUp(
  http: TestHttp,
  overrides: Partial<Pick<TestUser, 'email' | 'name' | 'password'>> = {},
): Promise<TestUser> {
  const email = overrides.email ?? uniqueEmail()
  const name = overrides.name ?? 'Test User'
  const password = overrides.password ?? PASSWORD
  const result = await http.client.auth.signUpEmail({
    email,
    name,
    password,
  })
  return { id: result.user.id, email, name, password }
}

export async function verifyEmail(
  http: TestHttp,
  mailer: FakeMailer,
  email: string,
): Promise<void> {
  const token = mailer.tokenFrom(mailer.lastFor(email, 'verify'))
  await http.client.auth.verifyEmail({ token })
}

export async function signIn(
  http: TestHttp,
  user: Pick<TestUser, 'email' | 'password'>,
) {
  return http.client.auth.signInEmail({
    email: user.email,
    password: user.password,
  })
}

export async function signUpVerified(
  http: TestHttp,
  mailer: FakeMailer,
  overrides: Partial<Pick<TestUser, 'email' | 'name' | 'password'>> = {},
): Promise<TestUser> {
  const user = await signUp(http, overrides)
  await verifyEmail(http, mailer, user.email)
  return user
}

export async function promoteToAdmin(
  db: Database,
  userId: string,
): Promise<void> {
  await db
    .update(schema.user)
    .set({ role: 'admin' })
    .where(eq(schema.user.id, userId))
}

export async function signUpAdmin(
  http: TestHttp,
  mailer: FakeMailer,
  db: Database,
  overrides: Partial<Pick<TestUser, 'email' | 'name' | 'password'>> = {},
): Promise<TestUser> {
  const user = await signUpVerified(http, mailer, overrides)
  await promoteToAdmin(db, user.id)
  await http.client.auth.signOut()
  await signIn(http, user)
  return user
}
