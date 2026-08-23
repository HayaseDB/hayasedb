import { randomUUID } from 'node:crypto'
import postgres from 'postgres'
import { inject } from 'vitest'

export interface TestDatabase {
  url: string
  name: string
  drop(): Promise<void>
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const infra = inject('infra')
  const name = `test_${randomUUID().replace(/-/g, '')}`
  const admin = postgres(infra.adminUrl, { max: 1 })
  await admin.unsafe(`CREATE DATABASE ${name} TEMPLATE ${infra.templateDb}`)
  await admin.end()

  return {
    url: infra.adminUrl.replace(/\/[^/]*$/, `/${name}`),
    name,
    drop: async () => {
      const client = postgres(infra.adminUrl, { max: 1 })
      await client.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`)
      await client.end()
    },
  }
}
