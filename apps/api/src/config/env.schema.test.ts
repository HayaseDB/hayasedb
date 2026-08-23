import { describe, expect, it } from 'vitest'
import { envSchema, validate } from './env.schema'

const base = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  AUTH_SECRET: 's'.repeat(32),
  MINIO_ACCESS_KEY: 'minio',
  MINIO_SECRET_KEY: 'minio123',
}

const TOKEN = 't'.repeat(32)

describe('envSchema', () => {
  it('accepts the minimal development config and applies defaults', () => {
    const env = validate(base)
    expect(env.NODE_ENV).toBe('development')
    expect(env.API_PORT).toBe(3000)
    expect(env.INTERNAL_API_TOKEN).toEqual([])
    expect(env.AUTH_TRUSTED_PROXIES).toContain('127.0.0.1')
    expect(env.MINIO_USE_SSL).toBe(false)
    expect(env.MAIL_SMTP_SECURE).toBe(false)
  })

  it.each([
    'DATABASE_URL',
    'AUTH_SECRET',
    'MINIO_ACCESS_KEY',
    'MINIO_SECRET_KEY',
  ])('requires %s', (key) => {
    const rest = Object.fromEntries(
      Object.entries(base).filter(([name]) => name !== key),
    )
    expect(() => validate(rest)).toThrow(key)
  })

  it('rejects a short AUTH_SECRET', () => {
    expect(() => validate({ ...base, AUTH_SECRET: 'short' })).toThrow(
      'AUTH_SECRET',
    )
  })

  it('splits, trims and drops empty csv entries', () => {
    const env = validate({
      ...base,
      INTERNAL_API_TOKEN: ` ${TOKEN} , ${TOKEN.replace(/t/g, 'u')},, `,
      AUTH_TRUSTED_ORIGINS: 'http://a.test, http://b.test',
    })
    expect(env.INTERNAL_API_TOKEN).toHaveLength(2)
    expect(env.AUTH_TRUSTED_ORIGINS).toEqual(['http://a.test', 'http://b.test'])
  })

  it('rejects any internal token shorter than 32 characters', () => {
    expect(() =>
      validate({ ...base, INTERNAL_API_TOKEN: `${TOKEN},short` }),
    ).toThrow('INTERNAL_API_TOKEN')
  })

  it('requires an internal token in production', () => {
    expect(() => validate({ ...base, NODE_ENV: 'production' })).toThrow(
      'INTERNAL_API_TOKEN is required in production',
    )
    expect(() =>
      validate({ ...base, NODE_ENV: 'production', INTERNAL_API_TOKEN: TOKEN }),
    ).not.toThrow()
  })

  it('coerces numeric ports and rejects invalid ones', () => {
    expect(validate({ ...base, API_PORT: '8080' }).API_PORT).toBe(8080)
    expect(() => validate({ ...base, API_PORT: '0' })).toThrow('API_PORT')
    expect(() => validate({ ...base, REDIS_PORT: 'nope' })).toThrow(
      'REDIS_PORT',
    )
  })

  it('parses boolean flags from their string form only', () => {
    expect(validate({ ...base, MINIO_USE_SSL: 'true' }).MINIO_USE_SSL).toBe(
      true,
    )
    expect(envSchema.safeParse({ ...base, MINIO_USE_SSL: '1' }).success).toBe(
      false,
    )
  })

  it('requires the resend api key only for the resend driver', () => {
    expect(() => validate({ ...base, MAIL_DRIVER: 'resend' })).toThrow(
      'MAIL_RESEND_API_KEY',
    )
    expect(
      validate({ ...base, MAIL_DRIVER: 'resend', MAIL_RESEND_API_KEY: 'k' })
        .MAIL_DRIVER,
    ).toBe('resend')
  })
})
