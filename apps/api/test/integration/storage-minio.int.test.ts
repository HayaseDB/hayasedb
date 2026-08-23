import { randomUUID } from 'node:crypto'
import {
  MinioContainer,
  type StartedMinioContainer,
} from '@testcontainers/minio'
import { createMinioDriver } from '@hayasedb/storage'
import { describeStorageDriver } from '@hayasedb/storage/testing'
import { afterAll, beforeAll } from 'vitest'

let container: StartedMinioContainer

beforeAll(async () => {
  container = await new MinioContainer(
    'minio/minio:RELEASE.2025-04-08T15-41-24Z',
  ).start()
}, 120_000)

afterAll(async () => {
  await container?.stop()
})

describeStorageDriver('minio', () =>
  createMinioDriver({
    driver: 'minio',
    endpoint: container.getHost(),
    port: container.getPort(),
    useSSL: false,
    accessKey: container.getUsername(),
    secretKey: container.getPassword(),
    bucket: `media-${randomUUID().slice(0, 8)}`,
    publicBaseUrl: `http://${container.getHost()}:${container.getPort()}`,
  }),
)
