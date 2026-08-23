import { COVER_FIXTURE } from '../fixtures/assets'
import { expect, loginVia, open, test } from '../fixtures/test'

test('@smoke contributor submits an anime and a moderator publishes it', async ({
  page,
  verifiedUser,
  adminPage,
}) => {
  const slug = `e2e-${Date.now().toString(36)}`
  const title = `E2E Show ${slug}`

  await loginVia(page, '', verifiedUser)
  await expect(
    page.getByRole('button', { name: verifiedUser.name }),
  ).toBeVisible()

  await open(page, '/contribute/new')
  await page.getByLabel('Slug').fill(slug)
  await page.getByLabel('English title').fill(title)

  await page.getByRole('tab', { name: 'Images' }).click()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Add cover' }).click()
  await (await chooser).setFiles(COVER_FIXTURE.path)
  await expect(
    page.getByRole('button', { name: 'Replace cover' }),
  ).toBeVisible()

  await page.getByLabel('Change summary').fill('Add a brand new show')
  await page.getByRole('button', { name: 'Submit for review' }).click()
  await expect(page).toHaveURL(/\/contributions\/[0-9a-f-]{36}$/)
  const changesetId = page.url().split('/').pop()!
  await expect(
    page.getByText('Add a brand new show', { exact: true }),
  ).toBeVisible()

  await open(adminPage, `/submissions/${changesetId}`)
  await adminPage.getByRole('button', { name: 'Approve and apply' }).click()
  await adminPage.getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(adminPage.getByRole('button', { name: 'Revert' })).toBeVisible()

  await open(page, `/anime/${slug}`)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  const cover = page.getByRole('img', { name: `${title} cover` }).first()
  await expect(cover).toHaveJSProperty('naturalWidth', COVER_FIXTURE.width)
  await expect(cover).toHaveJSProperty('naturalHeight', COVER_FIXTURE.height)
})
