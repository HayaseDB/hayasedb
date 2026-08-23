import { env, expect, loginVia, open, test } from '../fixtures/test'

test('api key is shown once and grants access through the public api', async ({
  page,
  verifiedUser,
}) => {
  await loginVia(page, '', verifiedUser)
  await expect(
    page.getByRole('button', { name: verifiedUser.name }),
  ).toBeVisible()

  await open(page, '/api-keys')
  await page.getByRole('button', { name: 'Create key' }).first().click()
  await page.getByLabel('Name').fill('e2e key')
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Create key' })
    .click()

  await expect(page.getByText('Store it now')).toBeVisible()
  const key = await page.getByRole('dialog').getByLabel('API key').inputValue()
  expect(key.length).toBeGreaterThan(20)
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByText('e2e key')).toBeVisible()
  await expect(page.getByText(key)).toHaveCount(0)

  const anon = await page.request.get(`${env.apiUrl}/api/anime`)
  expect(anon.status()).toBe(401)
  const keyed = await page.request.get(`${env.apiUrl}/api/anime`, {
    headers: { 'x-api-key': key },
  })
  expect(keyed.status()).toBe(200)
})

test('the web bff exposes only the web surface', async ({
  page,
  verifiedUser,
  adminPage,
}) => {
  await loginVia(page, '', verifiedUser)
  await expect(
    page.getByRole('button', { name: verifiedUser.name }),
  ).toBeVisible()

  const viaWeb = await page.request.get('/api/auth/admin/users')
  expect(viaWeb.status()).toBe(404)
  const session = await page.request.get('/api/auth/session')
  expect(session.status()).toBe(200)
  const forged = await page.request.get('/api/anime', {
    headers: { 'x-internal-token': 'forged', 'x-api-key': 'hyd_forged' },
  })
  expect(forged.status()).toBe(200)
  const direct = await page.request.get(`${env.apiUrl}/api/anime`, {
    headers: { 'x-internal-token': 'forged', 'x-api-key': 'hyd_forged' },
  })
  expect(direct.status()).toBe(401)

  const viaAdmin = await adminPage.request.get(
    `${env.adminUrl}/api/auth/admin/users`,
  )
  expect(viaAdmin.status()).toBe(200)
})
