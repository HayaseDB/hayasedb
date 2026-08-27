#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { defineCommand, runCommand, runMain } from 'citty'
import { CliError, EXIT_FAILURE, EXIT_USAGE, log, prepareInput } from './tui'

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string }

const main = defineCommand({
  meta: {
    name: 'hayasedb',
    version: pkg.version,
    description: 'HayaseDB project console',
  },
  subCommands: {
    db: () => import('./commands/db').then((m) => m.default),
    user: () => import('./commands/user').then((m) => m.default),
    seed: () => import('./commands/seed').then((m) => m.default),
  },
})

prepareInput()

const rawArgs = process.argv.slice(2)

const wantsUsage =
  rawArgs.length === 0 ||
  rawArgs.some((arg) => ['--help', '-h', '--version', '-v'].includes(arg))

if (wantsUsage) {
  void runMain(main, { rawArgs })
} else {
  try {
    await runCommand(main, { rawArgs })
  } catch (error) {
    if (error instanceof CliError) {
      log.error(error.message)
      process.exit(error.exitCode)
    }
    if (error instanceof Error && error.name === 'CLIError') {
      log.error(error.message)
      process.exit(EXIT_USAGE)
    }
    log.error(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    )
    process.exit(EXIT_FAILURE)
  }
}
