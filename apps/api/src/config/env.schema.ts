import * as z from 'zod'

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    API_HOST: z.string().default('0.0.0.0'),
    API_PORT: z.coerce.number().int().positive().default(3000),
    API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),

    DATABASE_URL: z.string().url(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),

    AUTH_SECRET: z.string().min(1),
    AUTH_BASE_URL: z.string().url(),
    AUTH_TRUSTED_ORIGINS: z
      .string()
      .default('http://localhost:3001,http://localhost:3002')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),

    S3_ENDPOINT: z.string().url().default('http://localhost:3900'),
    S3_REGION: z.string().default('garage'),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET_PUBLIC: z.string().default('media-public'),
    S3_BUCKET_ORIGINAL: z.string().default('media-original'),

    MAIL_DRIVER: z.enum(['smtp', 'resend']).default('smtp'),
    MAIL_FROM: z.string().default('Hayasedb <no-reply@hayasedb.com>'),

    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.MAIL_DRIVER === 'resend' && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['RESEND_API_KEY'],
        message: 'RESEND_API_KEY is required when MAIL_DRIVER is "resend"',
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
