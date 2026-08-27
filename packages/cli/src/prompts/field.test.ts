import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { emailSchema } from '@hayasedb/contract'
import { CliError } from '../tui'
import { resolveField, validateValue } from './field'

const prompted = 'prompted@example.com'
const never = () => Promise.reject(new Error('should not prompt'))

describe('validateValue', () => {
  it('returns the parsed output on success', () => {
    expect(validateValue(emailSchema, ' user@example.com ')).toEqual({
      ok: true,
      value: 'user@example.com',
    })
  })

  it('returns the first issue message on failure', () => {
    const result = validateValue(emailSchema, 'nope')
    expect(result).toEqual({
      ok: false,
      message: 'Enter a valid email address',
    })
  })

  it('applies transforms from the schema', () => {
    const schema = z.string().transform((value) => value.toUpperCase())
    expect(validateValue(schema, 'abc')).toEqual({ ok: true, value: 'ABC' })
  })
})

describe('resolveField', () => {
  it('uses a supplied argument without prompting', async () => {
    await expect(
      resolveField({
        argValue: 'user@example.com',
        flag: '--email',
        schema: emailSchema,
        prompt: never,
      }),
    ).resolves.toBe('user@example.com')
  })

  it('validates a supplied argument with the same schema as the prompt', async () => {
    const promise = resolveField({
      argValue: 'not-an-email',
      flag: '--email',
      schema: emailSchema,
      prompt: never,
    })
    await expect(promise).rejects.toThrow(CliError)
    await expect(promise).rejects.toThrow(
      '--email: Enter a valid email address',
    )
  })

  it('exits with a usage code when a supplied argument is invalid', async () => {
    const error = await resolveField({
      argValue: 'not-an-email',
      flag: '--email',
      schema: emailSchema,
      prompt: never,
    }).catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(CliError)
    expect((error as CliError).exitCode).toBe(2)
  })

  it('prompts when the argument is missing and a terminal is available', async () => {
    await expect(
      resolveField({
        argValue: undefined,
        flag: '--email',
        schema: emailSchema,
        interactive: true,
        prompt: () => Promise.resolve(prompted),
      }),
    ).resolves.toBe(prompted)
  })

  it('names the missing flag instead of hanging without a terminal', async () => {
    const promise = resolveField({
      argValue: undefined,
      flag: '--email',
      schema: emailSchema,
      interactive: false,
      prompt: never,
    })
    await expect(promise).rejects.toThrow(
      'Missing --email. Pass it as a flag when running without a terminal.',
    )
  })
})

describe('resolveField fallback', () => {
  it('uses the fallback instead of erroring when non-interactive', async () => {
    await expect(
      resolveField({
        argValue: undefined,
        flag: '--role',
        schema: z.enum(['user', 'admin']),
        fallback: 'user' as const,
        interactive: false,
        prompt: () => Promise.reject(new Error('must not prompt')),
      }),
    ).resolves.toBe('user')
  })

  it('still prefers an explicit arg over the fallback', async () => {
    await expect(
      resolveField({
        argValue: 'admin',
        flag: '--role',
        schema: z.enum(['user', 'admin']),
        fallback: 'user' as const,
        interactive: false,
        prompt: () => Promise.reject(new Error('must not prompt')),
      }),
    ).resolves.toBe('admin')
  })
})
