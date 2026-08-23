import { describe, expect, it } from 'vitest'
import {
  PASSWORD_MIN,
  adminListUsersInputSchema,
  changePasswordSchema,
  emailSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth'

describe('emailSchema', () => {
  it('trims and validates', () => {
    expect(emailSchema.parse('  a@b.co ')).toBe('a@b.co')
    expect(emailSchema.safeParse('nope').success).toBe(false)
  })

  it('reports a required message when missing', () => {
    const result = emailSchema.safeParse(undefined)
    expect(result.error?.issues[0]?.message).toBe('Email is required')
  })
})

describe('registerSchema', () => {
  it('enforces the minimum password length', () => {
    const base = { name: 'Ann', email: 'a@b.co' }
    expect(
      registerSchema.safeParse({
        ...base,
        password: 'x'.repeat(PASSWORD_MIN - 1),
      }).success,
    ).toBe(false)
    expect(
      registerSchema.safeParse({ ...base, password: 'x'.repeat(PASSWORD_MIN) })
        .success,
    ).toBe(true)
  })
})

describe('password confirmation refines', () => {
  it('flags the confirmation field when passwords differ', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'correct-horse',
      confirmPassword: 'battery-staple',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['confirmPassword'])
  })

  it('allows matching passwords on change', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'old',
        newPassword: 'correct-horse',
        confirmPassword: 'correct-horse',
      }).success,
    ).toBe(true)
  })
})

describe('adminListUsersInputSchema', () => {
  it.each([
    [{}, true],
    [{ filterField: 'role', filterValue: 'admin' }, true],
    [{ filterField: 'role', filterValue: 'true' }, false],
    [{ filterField: 'banned', filterValue: 'true' }, true],
    [{ filterField: 'banned', filterValue: true }, true],
    [{ filterField: 'banned', filterValue: 'admin' }, false],
    [{ filterValue: 'admin' }, false],
    [{ filterField: 'role' }, false],
  ])('%j => %s', (input, ok) => {
    expect(adminListUsersInputSchema.safeParse(input).success).toBe(ok)
  })
})
