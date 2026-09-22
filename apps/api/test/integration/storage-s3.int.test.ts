import { randomUUID } from 'node:crypto'
import { createS3Driver } from '@hayasedb/storage'
import { describeStorageDriver } from '@hayasedb/storage/testing'
import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'
import { afterAll, beforeAll } from 'vitest'

const ACCESS_KEY = 'rustfsadmin'
const SECRET_KEY = 'rustfsadmin-secret'

let container: StartedTestContainer

beforeAll(async () => {
  container = await new GenericContainer('rustfs/rustfs:1.0.0')
    .withCommand(['/data'])
    .withEnvironment({
      RUSTFS_ACCESS_KEY: ACCESS_KEY,
      RUSTFS_SECRET_KEY: SECRET_KEY,
      RUSTFS_ADDRESS: ':9000',
      RUSTFS_CONSOLE_ENABLE: 'false',
    })
    .withExposedPorts(9000)
    .withWaitStrategy(Wait.forHttp('/health', 9000).forStatusCode(200))
    .withStartupTimeout(120_000)
    .start()
}, 180_000)

afterAll(async () => {
  await container?.stop()
})

describeStorageDriver('s3', () =>
  createS3Driver({
    driver: 's3',
    endpoint: container.getHost(),
    port: container.getMappedPort(9000),
    useSSL: false,
    accessKey: ACCESS_KEY,
    secretKey: SECRET_KEY,
    bucket: `media-${randomUUID().slice(0, 8)}`,
    publicBaseUrl: `http://${container.getHost()}:${container.getMappedPort(9000)}`,
  }),
)
