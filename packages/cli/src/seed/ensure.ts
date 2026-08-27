import { withAuth, withDb } from '../context'
import type { AuthEnv } from '../env'
import {
  createVerifiedUser,
  describeCreatedUser,
  findUserByEmail,
} from '../users'
import { CliError, log } from '../tui'
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
  throw new CliError(
    `User ${user.email} does not exist yet, so it cannot author seeded data.${hint}`,
  )
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
          log.info(`User ${seedUser.email} already exists.`)
        }
        continue
      }
      await createVerifiedUser(auth, db, seedUser)
      log.success(describeCreatedUser(seedUser.role, seedUser.email))
    }
  })
}
