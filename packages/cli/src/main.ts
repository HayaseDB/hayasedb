#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { defineCommand, runMain } from 'citty'

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

void runMain(main)
