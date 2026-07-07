import * as z from 'zod'

function requiredString(label: string) {
  return z.string({
    error: (issue) =>
      issue.input === undefined ? `${label} is required` : `${label} must be text`,
  })
}

export const emailSchema = requiredString('Email')
  .trim()
  .pipe(z.email('Enter a valid email address'))

export const currentPasswordSchema = requiredString('Password').min(
  1,
  'Password is required',
)

export const newPasswordSchema = requiredString('Password').min(
  8,
  'Password must be at least 8 characters',
)

export const nameSchema = requiredString('Name')
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters')

export const loginSchema = z.object({
  email: emailSchema,
  password: currentPasswordSchema,
})

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
})

export type LoginSchema = z.output<typeof loginSchema>
export type RegisterSchema = z.output<typeof registerSchema>
