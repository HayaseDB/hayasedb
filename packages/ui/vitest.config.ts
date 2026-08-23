import { fileURLToPath } from 'node:url'
import { nuxtProject } from '../nuxt/test/vitest-preset.ts'

export default nuxtProject({
  name: 'ui',
  rootDir: fileURLToPath(new URL('./test/fixture', import.meta.url)),
  include: ['app/**/*.test.ts', 'test/**/*.test.ts'],
})
