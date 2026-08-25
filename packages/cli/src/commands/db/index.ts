import { defineCommand } from 'citty'

export default defineCommand({
  meta: {
    name: 'db',
    description: 'Database maintenance',
  },
  subCommands: {
    migrate: () => import('./migrate').then((m) => m.default),
  },
})
