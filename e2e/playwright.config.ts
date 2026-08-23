import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { env } from './fixtures/env'

const root = fileURLToPath(new URL('..', import.meta.url))
const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.webUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testDir: './setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'bun ../../e2e/scripts/ensure-db.ts && node dist/src/main',
      cwd: `${root}apps/api`,
      url: `${env.apiUrl}/api/ready`,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'development' },
    },
    {
      command: 'node apps/web/.output/server/index.mjs',
      cwd: root,
      url: env.webUrl,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: new URL(env.webUrl).port,
        NODE_ENV: 'production',
      },
    },
    {
      command: 'node apps/admin/.output/server/index.mjs',
      cwd: root,
      url: env.adminUrl,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: new URL(env.adminUrl).port,
        NODE_ENV: 'production',
      },
    },
  ],
})
