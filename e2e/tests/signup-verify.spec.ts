import { uniqueUser } from '../fixtures/api'
import { linkFrom, waitForMail } from '../fixtures/mailpit'
import { expect, open, test, toast } from '../fixtures/test'

test('@smoke sign up, verify by mail, sign out', async ({ page }) => {
  const user = uniqueUser('signup')

  await open(page, '/register')
  await page.getByLabel('Name').fill(user.name)
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(toast(page, 'Check your inbox')).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: user.name })).toBeVisible()

  const mail = await waitForMail(user.email, /verify your hayasedb email/i)
  await open(page, linkFrom(mail, '/auth/verify-email'))
  await expect(
    page.locator('#__nuxt').getByText('Email verified', { exact: true }),
  ).toBeVisible()
  await waitForMail(user.email, /welcome to hayasedb/i)

  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.getByRole('button', { name: user.name }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()
})
