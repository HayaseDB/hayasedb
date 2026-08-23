import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import postgres from 'postgres'
import { E2E_DATABASE_SUFFIX, env } from '../fixtures/env'

const url = new URL(env.databaseUrl)
const database = url.pathname.slice(1)
if (!database.endsWith(E2E_DATABASE_SUFFIX)) {
  throw new Error(`Refusing to manage non-e2e database ${database}`)
}
url.pathname = '/postgres'

const keepExisting = !process.env.CI && process.env.E2E_KEEP_DB !== '0'

const sql = postgres(url.toString(), { max: 1 })
try {
  const [existing] = await sql`
    select 1 from pg_database where datname = ${database}
  `
  if (!existing || !keepExisting) {
    await sql.unsafe(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`)
    await sql.unsafe(`CREATE DATABASE "${database}"`)
    await rm(resolve(process.cwd(), env.storageLocalRoot), {
      recursive: true,
      force: true,
    })
  }
} finally {
  await sql.end()
}
