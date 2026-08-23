import { test as base, type Page } from '@playwright/test'
import { env, ADMIN } from './env'
import { createVerifiedUser, type Credentials } from './api'
import { ADMIN_STORAGE_STATE } from './storage'

type NuxtWindow = { useNuxtApp?: () => { isHydrating?: boolean } }

export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (globalThis as NuxtWindow).useNuxtApp?.().isHydrating === false,
  )
}

export async function open(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await waitForHydration(page)
}

export function toast(page: Page, title: string) {
  return page
    .getByLabel(/notifications/i)
    .getByText(title, { exact: true })
    .first()
}

export async function loginVia(
  page: Page,
  origin: string,
  user: Pick<Credentials, 'email' | 'password'>,
  path = '/login',
): Promise<void> {
  await open(page, `${origin}${path}`)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: /sign in/i }).click()
}

export const test = base.extend<{
  verifiedUser: Credentials
  adminPage: Page
}>({
  verifiedUser: async ({ browserName }, use) => {
    await use(await createVerifiedUser(browserName))
  },
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: env.adminUrl,
      storageState: ADMIN_STORAGE_STATE,
    })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect } from '@playwright/test'
export { env, ADMIN }
