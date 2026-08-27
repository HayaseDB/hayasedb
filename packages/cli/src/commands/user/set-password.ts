import { randomUUID } from 'node:crypto'
import { defineCommand } from 'citty'
import { and, eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { authEnv } from '../../env'
import { withAuth } from '../../context'
import { promptEmail, promptNewPassword } from '../../prompts/fields'
import { requireUserByEmail } from '../../users'
import { intro, isInteractive, outro, spinner } from '../../tui'

const CREDENTIAL_PROVIDER = 'credential'

export default defineCommand({
  meta: {
    name: 'set-password',
    description: 'Set a new password for an existing user',
  },
  args: {
    email: {
      type: 'positional',
      description: 'Email address of the user (prompted when omitted)',
      required: false,
    },
    password: {
      type: 'string',
      description: 'New password (omit to be prompted securely)',
    },
  },
  async run({ args }) {
    if (isInteractive()) intro('Set password')

    const email = await promptEmail(args.email)

    const env = authEnv()
    await withAuth(env, async (auth, db) => {
      const user = await requireUserByEmail(db, email)
      const password = await promptNewPassword(args.password)

      const progress = spinner()
      progress.start('Updating password…')
      try {
        const ctx = await auth.$context
        const hash = await ctx.password.hash(password)

        const updated = await db
          .update(schema.account)
          .set({ password: hash })
          .where(
            and(
              eq(schema.account.userId, user.id),
              eq(schema.account.providerId, CREDENTIAL_PROVIDER),
            ),
          )
          .returning({ id: schema.account.id })

        if (updated.length === 0) {
          await db.insert(schema.account).values({
            id: randomUUID(),
            accountId: user.id,
            providerId: CREDENTIAL_PROVIDER,
            userId: user.id,
            password: hash,
            updatedAt: new Date(),
          })
        }
      } catch (error) {
        progress.error('Could not update the password.')
        throw error
      }
      progress.stop(`Password updated for ${user.email}.`)
    })

    if (isInteractive()) outro('Done.')
  },
})
