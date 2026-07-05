import * as z from 'zod'

export const rawEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_USER: z.string().default('hayase'),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().default('hayasedb'),
  DATABASE_URL: z.string().url().optional(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_URL: z.string().url().optional(),

  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),

  AUTH_SECRET: z.string().min(1),
  AUTH_BASE_URL: z.string().url().optional(),
  AUTH_TRUSTED_ORIGINS: z
    .string()
    .default('http://localhost:3001,http://localhost:3002'),

  S3_ENDPOINT: z.string().url().default('http://localhost:3900'),
  S3_REGION: z.string().default('garage'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET_PUBLIC: z.string().default('media-public'),
  S3_BUCKET_ORIGINAL: z.string().default('media-original'),

  NUXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000'),
  WEB_PORT: z.coerce.number().int().positive().default(3001),
  ADMIN_PORT: z.coerce.number().int().positive().default(3002),
})

export type RawEnv = z.infer<typeof rawEnvSchema>
