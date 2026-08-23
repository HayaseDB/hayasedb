import { fileURLToPath } from 'node:url'
import { nuxtProject } from '../../packages/nuxt/test/vitest-preset.ts'

export default nuxtProject({
  name: 'web',
  rootDir: fileURLToPath(new URL('.', import.meta.url)),
  include: ['test/**/*.test.ts'],
})
