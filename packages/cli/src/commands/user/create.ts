import { defineCommand } from 'citty'
import { authEnv } from '../../env'
import { withAuth } from '../../context'
import {
  promptEmail,
  promptName,
  promptNewPassword,
  promptRole,
} from '../../prompts/fields'
import {
  USER_ROLES,
  createVerifiedUser,
  describeCreatedUser,
  findUserByEmail,
  resolveRole,
} from '../../users'
import { CliError, intro, isInteractive, outro, spinner } from '../../tui'

export default defineCommand({
  meta: {
    name: 'create',
    description: 'Create a user with a verified email address',
  },
  args: {
    email: {
      type: 'positional',
      description: 'Email address of the new user (prompted when omitted)',
      required: false,
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
    },
    admin: {
      type: 'boolean',
      description: 'Shorthand for --role admin',
    },
  },
  async run({ args }) {
    if (isInteractive()) intro('Create user')

    const email = await promptEmail(args.email)

    const env = authEnv()
    await withAuth(env, async (auth, db) => {
      if (await findUserByEmail(db, email)) {
        throw new CliError(`A user with email ${email} already exists.`)
      }

      const name = await promptName(args.name, email.split('@')[0]!)
      const password = await promptNewPassword(args.password)
      const role = await promptRole(resolveRole(args))

      const progress = spinner()
      progress.start('Creating user…')
      try {
        await createVerifiedUser(auth, db, { email, name, password, role })
      } catch (error) {
        progress.error('Could not create the user.')
        throw error
      }
      progress.stop(describeCreatedUser(role, email))
    })

    if (isInteractive()) outro('Done.')
  },
})
