import { randomUUID } from 'node:crypto'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import { and, eq } from 'drizzle-orm'
import { schema } from '@hayasedb/db'
import { PASSWORD_MAX, PASSWORD_MIN } from '@hayasedb/contract'
import { authEnv } from '../../env'
import { withAuth } from '../../context'
import { promptNewPassword } from '../../prompts'
import { requireUserByEmail } from '../../users'

const CREDENTIAL_PROVIDER = 'credential'

export default defineCommand({
  meta: {
    name: 'set-password',
    description: 'Set a new password for an existing user',
  },
  args: {
    email: {
      type: 'positional',
      description: 'Email address of the user',
      required: true,
    },
    password: {
      type: 'string',
      description: 'New password (omit to be prompted securely)',
    },
  },
  async run({ args }) {
    const password = args.password ?? (await promptNewPassword())
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      consola.error(
        `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`,
      )
      process.exit(2)
    }

    const env = authEnv()
    await withAuth(env, async (auth, db) => {
      const user = await requireUserByEmail(db, args.email)

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

      consola.success(`Password updated for ${user.email}.`)
    })
  },
})
