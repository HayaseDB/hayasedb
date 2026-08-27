import type * as z from 'zod'
import { CliError, EXIT_USAGE, ask, isInteractive } from '../tui'

export type StringSchema<T> = z.ZodType<T, string>

export interface FieldOptions<T> {
  argValue: string | undefined
  flag: string
  schema: StringSchema<T>
  prompt: () => Promise<T | symbol>
  fallback?: T
  interactive?: boolean
}

export function validateValue<T>(
  schema: StringSchema<T>,
  value: string,
): { ok: true; value: T } | { ok: false; message: string } {
  const result = schema['~standard'].validate(value)
  if (result instanceof Promise) {
    throw new TypeError('Schema validation must be synchronous.')
  }
  const issue = result.issues?.at(0)
  return issue
    ? { ok: false, message: issue.message }
    : { ok: true, value: (result as { value: T }).value }
}

export async function resolveField<T>(options: FieldOptions<T>): Promise<T> {
  const { argValue, flag, schema, prompt } = options
  const interactive = options.interactive ?? isInteractive()

  if (argValue !== undefined) {
    const result = validateValue(schema, argValue)
    if (!result.ok) {
      throw new CliError(`${flag}: ${result.message}`, EXIT_USAGE)
    }
    return result.value
  }

  if (!interactive) {
    if (options.fallback !== undefined) return options.fallback
    throw new CliError(
      `Missing ${flag}. Pass it as a flag when running without a terminal.`,
      EXIT_USAGE,
    )
  }

  return ask(prompt)
}
