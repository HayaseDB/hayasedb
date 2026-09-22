import { describe, expect, it } from 'vitest'
import { envSchema, validate } from './env.schema'

const s3Storage = {
  STORAGE_DRIVER: 's3',
  STORAGE_PUBLIC_URL: 'http://localhost:9000',
  STORAGE_S3_ENDPOINT: 'localhost',
  STORAGE_S3_ACCESS_KEY: 'hayase',
  STORAGE_S3_SECRET_KEY: 'hayase-dev-secret',
}

const localStorage = {
  STORAGE_DRIVER: 'local',
  STORAGE_PUBLIC_URL: 'http://127.0.0.1:3000/api/files',
  STORAGE_LOCAL_ROOT: './.storage',
}

const base = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  AUTH_SECRET: 's'.repeat(32),
  ...s3Storage,
}

const TOKEN = 't'.repeat(32)

function s3(config: Record<string, unknown>) {
  const env = validate(config)
  if (env.STORAGE_DRIVER !== 's3') {
    throw new Error(`expected the s3 driver, got "${env.STORAGE_DRIVER}"`)
  }
  return env
}

describe('envSchema', () => {
  it('accepts the minimal development config and applies defaults', () => {
    const env = validate(base)
    expect(env.NODE_ENV).toBe('development')
    expect(env.API_PORT).toBe(3000)
    expect(env.INTERNAL_API_TOKEN).toEqual([])
    expect(env.AUTH_TRUSTED_PROXIES).toContain('127.0.0.1')
    expect(s3(base).STORAGE_S3_USE_SSL).toBe(false)
    expect(s3(base).STORAGE_S3_BUCKET).toBe('media')
    expect(s3(base).STORAGE_S3_PORT).toBe(9000)
    expect(env.MAIL_SMTP_SECURE).toBe(false)
  })

  it.each([
    'DATABASE_URL',
    'AUTH_SECRET',
    'STORAGE_DRIVER',
    'STORAGE_PUBLIC_URL',
    'STORAGE_S3_ENDPOINT',
    'STORAGE_S3_ACCESS_KEY',
    'STORAGE_S3_SECRET_KEY',
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

  it('allows disabling rate limits locally but never in production', () => {
    expect(validate(base).RATE_LIMIT_DISABLED).toBe(false)
    expect(
      validate({ ...base, RATE_LIMIT_DISABLED: 'true' }).RATE_LIMIT_DISABLED,
    ).toBe(true)
    expect(() =>
      validate({
        ...base,
        NODE_ENV: 'production',
        INTERNAL_API_TOKEN: TOKEN,
        RATE_LIMIT_DISABLED: 'true',
      }),
    ).toThrow('RATE_LIMIT_DISABLED')
  })

  it('coerces numeric ports and rejects invalid ones', () => {
    expect(validate({ ...base, API_PORT: '8080' }).API_PORT).toBe(8080)
    expect(() => validate({ ...base, API_PORT: '0' })).toThrow('API_PORT')
    expect(() => validate({ ...base, REDIS_PORT: 'nope' })).toThrow(
      'REDIS_PORT',
    )
  })

  it('parses boolean flags from their string form only', () => {
    expect(s3({ ...base, STORAGE_S3_USE_SSL: 'true' }).STORAGE_S3_USE_SSL).toBe(
      true,
    )
    expect(
      envSchema.safeParse({ ...base, STORAGE_S3_USE_SSL: '1' }).success,
    ).toBe(false)
  })

  it('validates only the selected storage driver', () => {
    const creds = {
      DATABASE_URL: base.DATABASE_URL,
      AUTH_SECRET: base.AUTH_SECRET,
    }
    const env = validate({ ...creds, ...localStorage })
    expect(env.STORAGE_DRIVER).toBe('local')
    expect(env).not.toHaveProperty('STORAGE_S3_ACCESS_KEY')
    expect(validate({ ...creds, ...s3Storage }).STORAGE_DRIVER).toBe('s3')
  })

  it('ignores variables belonging to the other driver', () => {
    const env = validate({
      DATABASE_URL: base.DATABASE_URL,
      AUTH_SECRET: base.AUTH_SECRET,
      ...localStorage,
      STORAGE_S3_ACCESS_KEY: 'ignored',
      STORAGE_S3_BUCKET: 'ignored',
    })
    expect(env).not.toHaveProperty('STORAGE_S3_ACCESS_KEY')
    expect(env).not.toHaveProperty('STORAGE_S3_BUCKET')
  })

  it('requires the local root only for the local driver', () => {
    const creds = {
      DATABASE_URL: base.DATABASE_URL,
      AUTH_SECRET: base.AUTH_SECRET,
    }
    expect(() =>
      validate({
        ...creds,
        STORAGE_DRIVER: localStorage.STORAGE_DRIVER,
        STORAGE_PUBLIC_URL: localStorage.STORAGE_PUBLIC_URL,
      }),
    ).toThrow('STORAGE_LOCAL_ROOT')
    expect(validate({ ...creds, ...s3Storage })).not.toHaveProperty(
      'STORAGE_LOCAL_ROOT',
    )
  })

  it('rejects an unknown storage driver', () => {
    expect(() => validate({ ...base, STORAGE_DRIVER: 'azure' })).toThrow(
      'STORAGE_DRIVER',
    )
  })

  it('rejects the retired minio driver name', () => {
    expect(() => validate({ ...base, STORAGE_DRIVER: 'minio' })).toThrow(
      'STORAGE_DRIVER',
    )
  })

  it('rejects the local driver in production', () => {
    expect(() =>
      validate({
        DATABASE_URL: base.DATABASE_URL,
        AUTH_SECRET: base.AUTH_SECRET,
        ...localStorage,
        NODE_ENV: 'production',
        INTERNAL_API_TOKEN: TOKEN,
      }),
    ).toThrow('STORAGE_DRIVER')
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
