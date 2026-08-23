import { expect, loginVia, open, test, toast } from '../fixtures/test'

test('protected page sends guests to login and back', async ({
  page,
  verifiedUser,
}) => {
  await open(page, '/settings')
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)settings$/)

  await page.getByLabel('Email').fill(verifiedUser.email)
  await page.getByLabel('Password', { exact: true }).fill(verifiedUser.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/settings$/)
  await expect(
    page.getByRole('button', { name: verifiedUser.name }),
  ).toBeVisible()
})

for (const redirect of ['//evil.example', '/\\evil.example']) {
  test(`open redirect ${redirect} falls back to home`, async ({
    page,
    verifiedUser,
  }) => {
    await loginVia(
      page,
      '',
      verifiedUser,
      `/login?redirect=${encodeURIComponent(redirect)}`,
    )
    await expect(page).toHaveURL(/\/$/)
    await expect(page).not.toHaveURL(/evil/)
  })
}

test('wrong password stays on login with an error', async ({
  page,
  verifiedUser,
}) => {
  await loginVia(page, '', {
    email: verifiedUser.email,
    password: 'definitely-wrong-1',
  })
  await expect(toast(page, 'Sign in failed')).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})
