import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { STORAGE_PUBLIC_PATH } from '@hayasedb/storage'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import type { Database } from '@hayasedb/db'
import type { Redis } from 'ioredis'
import { inject } from 'vitest'
import type { Env } from '../../src/config/env.schema'
import { configureApp } from '../../src/configure-app'
import { DRIZZLE } from '../../src/database/database.constants'
import { MAILER } from '../../src/mail/mail.constants'
import { REDIS } from '../../src/redis/redis.constants'
import { createFakeMailer, type FakeMailer } from './fake-mailer'
import { createTestDatabase, type TestDatabase } from './test-db'

export const INTERNAL_TOKEN = 'integration-internal-token-0123456789abcdef'
export const AUTH_SECRET = 'integration-auth-secret-0123456789abcdef0123'
export const WEB_ORIGIN = 'http://127.0.0.1:3001'
export const ADMIN_ORIGIN = 'http://127.0.0.1:3002'

export interface TestAppOptions {
  env?: Partial<Record<string, string>>
}

export interface TestApp {
  app: INestApplication
  baseUrl: string
  db: Database
  redis: Redis
  mailer: FakeMailer
  database: TestDatabase
  config: ConfigService<Env, true>
  close(): Promise<void>
}

async function freePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address() as { port: number }
  await new Promise<void>((resolve) => server.close(() => resolve()))
  return port
}

function applyEnv(
  database: TestDatabase,
  port: number,
  storageRoot: string,
  overrides: Record<string, string | undefined>,
) {
  const infra = inject('infra')
  const env: Record<string, string> = {
    NODE_ENV: 'test',
    API_HOST: '127.0.0.1',
    API_PORT: String(port),
    API_PUBLIC_URL: `http://127.0.0.1:${port}`,
    WEB_PUBLIC_URL: WEB_ORIGIN,
    ADMIN_PUBLIC_URL: ADMIN_ORIGIN,
    DATABASE_URL: database.url,
    REDIS_HOST: infra.redisHost,
    REDIS_PORT: String(infra.redisPort),
    AUTH_SECRET,
    INTERNAL_API_TOKEN: INTERNAL_TOKEN,
    AUTH_TRUSTED_ORIGINS: `${WEB_ORIGIN},${ADMIN_ORIGIN}`,
    AUTH_TRUSTED_PROXIES: '127.0.0.1,::1',
    STORAGE_DRIVER: 'local',
    STORAGE_LOCAL_ROOT: storageRoot,
    STORAGE_PUBLIC_URL: `http://127.0.0.1:${port}/api/${STORAGE_PUBLIC_PATH}`,
    MAIL_DRIVER: 'smtp',
    MAIL_SMTP_HOST: '127.0.0.1',
    MAIL_SMTP_PORT: '1',
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    DISCORD_CLIENT_ID: '',
    DISCORD_CLIENT_SECRET: '',
  }
  for (const [key, value] of Object.entries({ ...env, ...overrides })) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

let created = false

export async function createTestApp(
  options: TestAppOptions = {},
): Promise<TestApp> {
  if (created) {
    throw new Error(
      'createTestApp may only be called once per test file: ConfigModule reads process.env when AppModule is first imported',
    )
  }
  created = true
  const database = await createTestDatabase()
  const port = await freePort()
  const storageRoot = await mkdtemp(join(tmpdir(), 'hayasedb-storage-'))
  applyEnv(database, port, storageRoot, options.env ?? {})

  const { AppModule } = await import('../../src/app.module')
  const mailer = createFakeMailer()
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MAILER)
    .useValue(mailer)
    .compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    logger: false,
  })
  const config = app.get<ConfigService<Env, true>>(ConfigService)
  configureApp(app, config)
  await app.listen(port, '127.0.0.1')

  return {
    app,
    baseUrl: `http://127.0.0.1:${port}`,
    db: app.get<Database>(DRIZZLE),
    redis: app.get<Redis>(REDIS),
    mailer,
    database,
    config,
    close: async () => {
      await app.close()
      await database.drop()
      await rm(storageRoot, { recursive: true, force: true })
    },
  }
}
