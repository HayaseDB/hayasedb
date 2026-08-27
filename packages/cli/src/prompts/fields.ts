import * as p from '@clack/prompts'
import * as z from 'zod'
import {
  emailSchema,
  nameSchema,
  newPasswordSchema,
  PASSWORD_MAX,
} from '@hayasedb/contract'
import { CliError, EXIT_USAGE, ask, isInteractive } from '../tui'
import { USER_ROLES, type UserRole } from '../users'
import { resolveField, validateValue } from './field'

export const passwordSchema = newPasswordSchema.max(
  PASSWORD_MAX,
  `Password must be at most ${PASSWORD_MAX} characters`,
)

export const roleSchema = z.enum(USER_ROLES, {
  error: () => `Expected one of: ${USER_ROLES.join(', ')}`,
})

export function promptEmail(
  argValue: string | undefined,
  message = 'Email address',
): Promise<string> {
  return resolveField({
    argValue,
    flag: '--email',
    schema: emailSchema,
    prompt: () =>
      p.text({
        message,
        placeholder: 'user@example.com',
        validate: emailSchema,
      }),
  })
}

export function promptName(
  argValue: string | undefined,
  fallback: string,
): Promise<string> {
  return resolveField({
    argValue,
    flag: '--name',
    schema: nameSchema,
    prompt: () =>
      p.text({
        message: 'Display name',
        placeholder: fallback,
        defaultValue: fallback,
        validate: (value) => (value ? validateName(value) : undefined),
      }),
  })
}

function validateName(value: string): string | undefined {
  const result = validateValue(nameSchema, value)
  return result.ok ? undefined : result.message
}

export function promptRole(argValue: string | undefined): Promise<UserRole> {
  return resolveField({
    argValue,
    flag: '--role',
    schema: roleSchema,
    fallback: 'user',
    prompt: () =>
      p.select({
        message: 'Role',
        initialValue: 'user' as UserRole,
        options: USER_ROLES.map((role) => ({
          value: role,
          label: role,
          hint: role === 'admin' ? 'full access to the admin panel' : undefined,
        })),
      }),
  })
}

export async function promptNewPassword(
  argValue: string | undefined,
): Promise<string> {
  if (argValue !== undefined) {
    const result = validateValue(passwordSchema, argValue)
    if (!result.ok) {
      throw new CliError(`--password: ${result.message}`, EXIT_USAGE)
    }
    return result.value
  }

  if (!isInteractive()) {
    throw new CliError(
      'Missing --password. Pass it as a flag when running without a terminal.',
      EXIT_USAGE,
    )
  }

  const password = await ask(() =>
    p.password({ message: 'Password', validate: passwordSchema }),
  )
  const confirmation = await ask(() =>
    p.password({
      message: 'Confirm password',
      validate: (value) =>
        value === password ? undefined : 'Passwords do not match',
    }),
  )
  return confirmation
}
