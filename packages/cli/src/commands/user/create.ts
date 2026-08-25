import { defineCommand } from 'citty'
import { consola } from 'consola'
import { eq } from 'drizzle-orm'
import * as z from 'zod'
import { schema } from '@hayasedb/db'
import { PASSWORD_MAX, PASSWORD_MIN } from '@hayasedb/contract'
import { authEnv } from '../../env'
import { withAuth } from '../../context'
import { promptNewPassword } from '../../prompts'
import { USER_ROLES, findUserByEmail, type UserRole } from '../../users'

export default defineCommand({
  meta: {
    name: 'create',
    description: 'Create a user with a verified email address',
  },
  args: {
    email: {
      type: 'positional',
      description: 'Email address of the new user',
      required: true,
    },
    name: {
      type: 'string',
      description: 'Display name (defaults to the email local part)',
    },
    password: {
      type: 'string',
      description: 'Password (omit to be prompted securely)',
    },
    role: {
      type: 'string',
      description: `Role to assign (${USER_ROLES.join(', ')})`,
      default: 'user',
    },
    admin: {
      type: 'boolean',
      description: 'Shorthand for --role admin',
      default: false,
    },
  },
  async run({ args }) {
    const email = z.string().pipe(z.email()).safeParse(args.email)
    if (!email.success) {
      consola.error(`"${args.email}" is not a valid email address.`)
      process.exit(2)
    }

    const role = (args.admin ? 'admin' : args.role) as UserRole
    if (!USER_ROLES.includes(role)) {
      consola.error(
        `Unknown role "${args.role}". Expected one of: ${USER_ROLES.join(', ')}.`,
      )
      process.exit(2)
    }

    const password = args.password ?? (await promptNewPassword())
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
      consola.error(
        `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters.`,
      )
      process.exit(2)
    }

    const env = authEnv()
    await withAuth(env, async (auth, db) => {
      if (await findUserByEmail(db, email.data)) {
        consola.error(`A user with email ${email.data} already exists.`)
        process.exit(1)
      }

      const created = await auth.api.createUser({
        body: {
          email: email.data,
          password,
          name: args.name ?? email.data.split('@')[0]!,
          role,
        },
      })

      await db
        .update(schema.user)
        .set({ emailVerified: true })
        .where(eq(schema.user.id, created.user.id))

      consola.success(`Created ${role} user ${email.data}.`)
    })
  },
})
