import { describe, expect, it } from 'vitest'
import { CliError } from './tui'
import { describeCreatedUser, resolveRole } from './users'

describe('resolveRole', () => {
  it('returns undefined when neither flag is given, so the role is prompted', () => {
    expect(resolveRole({})).toBeUndefined()
  })

  it('passes an explicit role through', () => {
    expect(resolveRole({ role: 'admin' })).toBe('admin')
    expect(resolveRole({ role: 'user' })).toBe('user')
  })

  it('treats --admin as a shorthand for --role admin', () => {
    expect(resolveRole({ admin: true })).toBe('admin')
    expect(resolveRole({ admin: true, role: 'admin' })).toBe('admin')
  })

  it('rejects --admin combined with a conflicting --role', () => {
    expect(() => resolveRole({ admin: true, role: 'user' })).toThrow(CliError)
    expect(() => resolveRole({ admin: true, role: 'user' })).toThrow(
      '--admin conflicts with --role user.',
    )
  })

  it('leaves an unknown role for the schema to reject', () => {
    expect(resolveRole({ role: 'wizard' })).toBe('wizard')
  })
})

describe('describeCreatedUser', () => {
  it('does not repeat the word user for the default role', () => {
    expect(describeCreatedUser('user', 'a@b.co')).toBe('Created user a@b.co.')
  })

  it('names the role for admins', () => {
    expect(describeCreatedUser('admin', 'a@b.co')).toBe(
      'Created admin user a@b.co.',
    )
  })
})
