import { MinioContainer } from '@testcontainers/minio'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { RedisContainer } from '@testcontainers/redis'
import { runMigrations } from '@hayasedb/db'
import postgres from 'postgres'
import type { TestProject } from 'vitest/node'

export const TEMPLATE_DB = 'template_hayasedb'

export interface IntegrationInfra {
  adminUrl: string
  templateDb: string
  redisHost: string
  redisPort: number
  minioEndpoint: string
  minioPort: number
  minioAccessKey: string
  minioSecretKey: string
}

declare module 'vitest' {
  export interface ProvidedContext {
    infra: IntegrationInfra
  }
}

export default async function setup(project: TestProject) {
  const [pg, redis, minio] = await Promise.all([
    new PostgreSqlContainer('postgres:18').start(),
    new RedisContainer('redis:8').start(),
    new MinioContainer('minio/minio:RELEASE.2025-04-08T15-41-24Z').start(),
  ])

  const stop = () => Promise.all([pg.stop(), redis.stop(), minio.stop()])

  try {
    const adminUrl = pg.getConnectionUri()
    const templateUrl = adminUrl.replace(/\/[^/]*$/, `/${TEMPLATE_DB}`)
    const admin = postgres(adminUrl, { max: 1 })
    try {
      await admin.unsafe(`CREATE DATABASE ${TEMPLATE_DB}`)
      await runMigrations(templateUrl)
      await admin.unsafe(`ALTER DATABASE ${TEMPLATE_DB} IS_TEMPLATE true`)
    } finally {
      await admin.end()
    }

    project.provide('infra', {
      adminUrl,
      templateDb: TEMPLATE_DB,
      redisHost: redis.getHost(),
      redisPort: redis.getPort(),
      minioEndpoint: minio.getHost(),
      minioPort: minio.getPort(),
      minioAccessKey: minio.getUsername(),
      minioSecretKey: minio.getPassword(),
    })
  } catch (error) {
    await stop()
    throw error
  }

  return async () => {
    await stop()
  }
}
