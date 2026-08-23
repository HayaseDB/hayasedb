import { nodeProject } from '../../vitest.presets.ts'

export default nodeProject({
  name: 'nuxt-layer',
  include: ['app/**/*.test.ts', 'server/**/*.test.ts'],
  setupFiles: ['./test/setup.ts'],
})
