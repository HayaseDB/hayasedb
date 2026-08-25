import { defineCommand } from 'citty'
import { consola } from 'consola'
import { runMigrations } from '@hayasedb/db'
import { dbEnv } from '../../env'

export default defineCommand({
  meta: {
    name: 'migrate',
    description: 'Apply pending database migrations',
  },
  async run() {
    const env = dbEnv()
    consola.start('Applying migrations…')
    try {
      await runMigrations(env.DATABASE_URL)
    } catch (error) {
      consola.error(error instanceof Error ? error.message : error)
      process.exit(1)
    }
    consola.success('Migrations applied.')
  },
})
