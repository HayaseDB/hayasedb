import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { consola } from 'consola'
import { withAuth, withDb } from '../context'
import type { AuthEnv } from '../env'
import { findUserByEmail } from '../users'
import type { SeedUser } from './types'

export async function assertUserExists(
  env: AuthEnv,
  user: SeedUser,
  userStepName: string | undefined,
): Promise<void> {
  const exists = await withDb(env, (db) => findUserByEmail(db, user.email))
  if (exists) return
  const hint = userStepName
    ? ` Select the "${userStepName}" step or run it first with --only ${userStepName}.`
    : ''
  consola.error(
    `User ${user.email} does not exist yet, so it cannot author seeded data.${hint}`,
  )
  process.exit(1)
}

export async function ensureUsers(
  env: AuthEnv,
  users: SeedUser[],
  options: { silentExisting?: boolean } = {},
): Promise<void> {
  await withAuth(env, async (auth, db) => {
    for (const seedUser of users) {
      if (await findUserByEmail(db, seedUser.email)) {
        if (!options.silentExisting) {
          consola.info(`User ${seedUser.email} already exists.`)
        }
        continue
      }
      const created = await auth.api.createUser({
        body: {
          email: seedUser.email,
          password: seedUser.password,
          name: seedUser.name,
          role: seedUser.role,
        },
      })
      await db
        .update(schema.user)
        .set({ emailVerified: true })
        .where(eq(schema.user.id, created.user.id))
      consola.success(`Created ${seedUser.role} user ${seedUser.email}.`)
    }
  })
}
