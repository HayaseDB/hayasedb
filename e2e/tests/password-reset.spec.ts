import { linkFrom, waitForMail } from '../fixtures/mailpit'
import { expect, loginVia, open, test, toast } from '../fixtures/test'

test('reset password through the mailed link', async ({
  page,
  verifiedUser,
}) => {
  const nextPassword = `${verifiedUser.password}-next`

  await open(page, '/auth/forgot-password')
  await page.getByLabel('Email').fill(verifiedUser.email)
  await page.getByRole('button', { name: /send|reset/i }).click()
  await expect(toast(page, 'Check your inbox')).toBeVisible()

  const mail = await waitForMail(
    verifiedUser.email,
    /reset your hayasedb password/i,
  )
  await open(page, linkFrom(mail, '/auth/reset-password'))
  await page.getByLabel('New password').fill(nextPassword)
  await page.getByLabel('Confirm password').fill(nextPassword)
  await page.getByRole('button', { name: /reset|update|set/i }).click()
  await expect(page).toHaveURL(/\/login/)

  await loginVia(page, '', {
    email: verifiedUser.email,
    password: verifiedUser.password,
  })
  await expect(toast(page, 'Sign in failed')).toBeVisible()

  await loginVia(page, '', {
    email: verifiedUser.email,
    password: nextPassword,
  })
  await expect(
    page.getByRole('button', { name: verifiedUser.name }),
  ).toBeVisible()
})
