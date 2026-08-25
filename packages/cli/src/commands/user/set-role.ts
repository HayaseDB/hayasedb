import { defineCommand } from 'citty'
import { consola } from 'consola'
import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { dbEnv } from '../../env'
import { withDb } from '../../context'
import { USER_ROLES, requireUserByEmail, type UserRole } from '../../users'

export default defineCommand({
  meta: {
    name: 'set-role',
    description: 'Change the role of an existing user',
  },
  args: {
    email: {
      type: 'positional',
      description: 'Email address of the user',
      required: true,
    },
    role: {
      type: 'positional',
      description: `New role (${USER_ROLES.join(', ')})`,
      required: true,
    },
  },
  async run({ args }) {
    const role = args.role as UserRole
    if (!USER_ROLES.includes(role)) {
      consola.error(
        `Unknown role "${args.role}". Expected one of: ${USER_ROLES.join(', ')}.`,
      )
      process.exit(2)
    }

    const env = dbEnv()
    await withDb(env, async (db) => {
      const user = await requireUserByEmail(db, args.email)
      await db
        .update(schema.user)
        .set({ role })
        .where(eq(schema.user.id, user.id))
      consola.success(`Role of ${user.email} set to ${role}.`)
    })
  },
})
