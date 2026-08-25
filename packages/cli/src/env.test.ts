import { describe, expect, it } from 'vitest'
import { authEnvSchema, dbEnvSchema, seedEnvSchema } from './env'

const DATABASE_URL = 'postgres://demo:demo@localhost:5432/hayasedb'
const AUTH_SECRET = 'a'.repeat(32)

describe('dbEnvSchema', () => {
  it('accepts a valid database url and strips unknown keys', () => {
    const parsed = dbEnvSchema.parse({ DATABASE_URL, OTHER: 'x' })
    expect(parsed).toEqual({ DATABASE_URL })
  })

  it('rejects a missing or invalid database url', () => {
    expect(dbEnvSchema.safeParse({}).success).toBe(false)
    expect(dbEnvSchema.safeParse({ DATABASE_URL: 'nope' }).success).toBe(false)
  })
})

describe('authEnvSchema', () => {
  it('requires a sufficiently long auth secret', () => {
    expect(
      authEnvSchema.safeParse({ DATABASE_URL, AUTH_SECRET: 'short' }).success,
    ).toBe(false)
    const parsed = authEnvSchema.parse({ DATABASE_URL, AUTH_SECRET })
    expect(parsed.AUTH_SECRET).toBe(AUTH_SECRET)
  })

  it('defaults the web url', () => {
    const parsed = authEnvSchema.parse({ DATABASE_URL, AUTH_SECRET })
    expect(parsed.WEB_PUBLIC_URL).toBe('http://localhost:3001')
  })
})

describe('seedEnvSchema', () => {
  it('applies defaults', () => {
    const parsed = seedEnvSchema.parse({ DATABASE_URL, AUTH_SECRET })
    expect(parsed.NODE_ENV).toBe('development')
    expect(parsed.API_PUBLIC_URL).toBe('http://localhost:3000')
    expect(parsed.INTERNAL_API_TOKEN).toEqual([])
  })

  it('splits internal api tokens as csv', () => {
    const parsed = seedEnvSchema.parse({
      DATABASE_URL,
      AUTH_SECRET,
      INTERNAL_API_TOKEN: ' one , two ,, three ',
    })
    expect(parsed.INTERNAL_API_TOKEN).toEqual(['one', 'two', 'three'])
  })

  it('rejects an unknown node env', () => {
    expect(
      seedEnvSchema.safeParse({
        DATABASE_URL,
        AUTH_SECRET,
        NODE_ENV: 'staging',
      }).success,
    ).toBe(false)
  })
})
