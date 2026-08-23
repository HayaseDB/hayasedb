import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/*/vitest.config.{ts,mts}',
      'packages/*/vitest.int.config.{ts,mts}',
      'apps/*/vitest.config.{ts,mts}',
      'apps/*/vitest.int.config.{ts,mts}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov', 'json'],
      reportsDirectory: 'coverage',
      include: [
        'apps/api/src/**',
        'apps/web/app/**',
        'apps/admin/app/**',
        'packages/*/src/**',
        'packages/nuxt/app/**',
        'packages/nuxt/server/**',
        'packages/ui/app/**',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.int.test.ts',
        '**/dist/**',
        '**/.nuxt/**',
        'packages/db/src/schema/**',
        '**/migrate-cli.ts',
        '**/seed-demo.ts',
        'apps/api/src/main.ts',
      ],
    },
  },
})
