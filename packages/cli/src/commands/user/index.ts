import { defineCommand } from 'citty'

export default defineCommand({
  meta: {
    name: 'user',
    description: 'User management',
  },
  subCommands: {
    create: () => import('./create').then((m) => m.default),
    'set-password': () => import('./set-password').then((m) => m.default),
    'set-role': () => import('./set-role').then((m) => m.default),
  },
})
