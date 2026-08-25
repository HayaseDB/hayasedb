import { defineCommand } from 'citty'
import { SEED_SETS } from '../../seed/registry'
import { defineSeedSetCommand } from './set'

export default defineCommand({
  meta: {
    name: 'seed',
    description: 'Seed the database with data sets',
  },
  subCommands: Object.fromEntries(
    SEED_SETS.map((set) => [set.name, defineSeedSetCommand(set)]),
  ),
})
