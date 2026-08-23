import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export interface NuxtProjectOptions {
  name: string
  rootDir: string
  include?: string[]
}

export function nuxtProject(options: NuxtProjectOptions) {
  return defineVitestConfig({
    test: {
      name: options.name,
      environment: 'nuxt',
      include: options.include ?? ['**/*.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/.nuxt/**'],
      setupFiles: [
        fileURLToPath(new URL('./silence-vue-notices.ts', import.meta.url)),
      ],
      hookTimeout: 60_000,
      testTimeout: 30_000,
      environmentOptions: {
        nuxt: {
          rootDir: options.rootDir,
          domEnvironment: 'happy-dom',
        },
      },
    },
  })
}
