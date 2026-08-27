import { defineCommand } from 'citty'
import { eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { dbEnv } from '../../env'
import { withDb } from '../../context'
import { promptEmail, promptRole } from '../../prompts/fields'
import { USER_ROLES, requireUserByEmail } from '../../users'
import { intro, isInteractive, log, outro } from '../../tui'

export default defineCommand({
  meta: {
    name: 'set-role',
    description: 'Change the role of an existing user',
  },
  args: {
    email: {
      type: 'positional',
      description: 'Email address of the user (prompted when omitted)',
      required: false,
    },
    role: {
      type: 'positional',
      description: `New role (${USER_ROLES.join(', ')}); prompted when omitted`,
      required: false,
    },
  },
  async run({ args }) {
    if (isInteractive()) intro('Set role')

    const email = await promptEmail(args.email)

    const env = dbEnv()
    await withDb(env, async (db) => {
      const user = await requireUserByEmail(db, email)
      const role = await promptRole(args.role)

      await db
        .update(schema.user)
        .set({ role })
        .where(eq(schema.user.id, user.id))
      log.success(`Role of ${user.email} set to ${role}.`)
    })

    if (isInteractive()) outro('Done.')
  },
})
