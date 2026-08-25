import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { consola } from 'consola'
import * as z from 'zod'

let envFileLoaded = false

function loadEnvFile(): void {
  if (envFileLoaded) return
  config({
    path: fileURLToPath(new URL('../../../.env', import.meta.url)),
    quiet: true,
  })
  envFileLoaded = true
}

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

export const dbEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
})

export const authEnvSchema = dbEnvSchema.extend({
  AUTH_SECRET: z.string().min(32),
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:3001'),
})

export const seedEnvSchema = authEnvSchema.extend({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  INTERNAL_API_TOKEN: csv(''),
})

export type DbEnv = z.output<typeof dbEnvSchema>
export type AuthEnv = z.output<typeof authEnvSchema>
export type SeedEnv = z.output<typeof seedEnvSchema>

function parseEnv<Schema extends z.ZodType>(schema: Schema): z.output<Schema> {
  loadEnvFile()
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    consola.error(
      `Invalid environment configuration:\n${z.prettifyError(parsed.error)}`,
    )
    process.exit(2)
  }
  return parsed.data
}

export const dbEnv = (): DbEnv => parseEnv(dbEnvSchema)
export const authEnv = (): AuthEnv => parseEnv(authEnvSchema)
export const seedEnv = (): SeedEnv => parseEnv(seedEnvSchema)
