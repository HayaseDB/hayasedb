import { defineCommand } from 'citty'
import { runMigrations } from '@hayasedb/db'
import { dbEnv } from '../../env'
import { CliError, spinner } from '../../tui'

export default defineCommand({
  meta: {
    name: 'migrate',
    description: 'Apply pending database migrations',
  },
  async run() {
    const env = dbEnv()
    const progress = spinner()
    progress.start('Applying migrations…')
    try {
      await runMigrations(env.DATABASE_URL)
    } catch (error) {
      progress.error('Migration failed.')
      throw new CliError(error instanceof Error ? error.message : String(error))
    }
    progress.stop('Migrations applied.')
  },
})
