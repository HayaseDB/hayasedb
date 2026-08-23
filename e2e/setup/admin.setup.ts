import { test as setup } from '@playwright/test'
import { ADMIN, env } from '../fixtures/env'
import { loginVia } from '../fixtures/test'
import { ADMIN_STORAGE_STATE } from '../fixtures/storage'

setup('authenticate admin', async ({ page }) => {
  await loginVia(page, env.adminUrl, ADMIN)
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
