import { defineConfig } from 'vitest/config'

export interface NodeProjectOptions {
  name: string
  include?: string[]
  setupFiles?: string[]
}

export function nodeProject(options: NodeProjectOptions) {
  return defineConfig({
    test: {
      name: options.name,
      environment: 'node',
      include: options.include ?? ['**/*.test.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/.nuxt/**'],
      setupFiles: options.setupFiles,
    },
  })
}

export interface IntegrationProjectOptions extends NodeProjectOptions {
  globalSetup?: string[]
}

export function integrationProject(options: IntegrationProjectOptions) {
  return defineConfig({
    test: {
      name: options.name,
      environment: 'node',
      include: options.include ?? ['test/**/*.int.test.ts'],
      setupFiles: options.setupFiles,
      globalSetup: options.globalSetup,
      testTimeout: 60_000,
      hookTimeout: 120_000,
      pool: 'forks',
    },
  })
}
