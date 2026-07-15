import * as z from 'zod'

const csv = (defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    )

const appEnv = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  WEB_PUBLIC_URL: z.string().url().optional(),
})

const dbEnv = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
})

const authEnv = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_TRUSTED_ORIGINS: csv(
    'http://localhost:3001,http://localhost:3002,http://127.0.0.1:3001',
  ),
  AUTH_TRUSTED_PROXIES: csv(
    '127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16',
  ),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),
})

const minioEnv = z.object({
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().default('media'),
  MINIO_PUBLIC_URL: z.string().url().default('http://localhost:9000'),
})

const mailEnv = z.object({
  MAIL_DRIVER: z.enum(['smtp', 'resend']).default('smtp'),
  MAIL_FROM: z.string().default('Hayasedb <no-reply@hayasedb.com>'),

  MAIL_SMTP_HOST: z.string().default('localhost'),
  MAIL_SMTP_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  MAIL_SMTP_USER: z.string().optional(),
  MAIL_SMTP_PASS: z.string().optional(),

  MAIL_RESEND_API_KEY: z.string().optional(),
})

export const envSchema = appEnv
  .extend(dbEnv.shape)
  .extend(authEnv.shape)
  .extend(minioEnv.shape)
  .extend(mailEnv.shape)
  .superRefine((env, ctx) => {
    if (env.MAIL_DRIVER === 'resend' && !env.MAIL_RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['MAIL_RESEND_API_KEY'],
        message: 'MAIL_RESEND_API_KEY is required when MAIL_DRIVER is "resend"',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

export function validate(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config)
  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration:\n${z.prettifyError(parsed.error)}`,
    )
  }
  return parsed.data
}
