import { seedRelatedPair } from '../fixtures/api'
import { expect, open, test, waitForHydration } from '../fixtures/test'

test('@smoke explore filters sync to the url and survive reload', async ({
  page,
}) => {
  const { first, second, stamp } = await seedRelatedPair()

  await open(page, '/explore')
  await page.getByLabel('Search anime').fill(`Browse`)
  await expect(page).toHaveURL(/q=Browse/)
  await expect(page.getByText(`Browse One ${stamp}`)).toBeVisible()
  await expect(page.getByText(`Browse Two ${stamp}`)).toBeVisible()

  await page.getByLabel('Format').click()
  await page.getByRole('option', { name: 'Movie' }).click()
  await expect(page).toHaveURL(/format=MOVIE/)
  await expect(page.getByText(`Browse Two ${stamp}`)).toBeVisible()
  await expect(page.getByText(`Browse One ${stamp}`)).toHaveCount(0)

  await page.reload()
  await waitForHydration(page)
  await expect(page.getByLabel('Search anime')).toHaveValue('Browse')
  await expect(page.getByText(`Browse Two ${stamp}`)).toBeVisible()
  await expect(page.getByText(`Browse One ${stamp}`)).toHaveCount(0)

  await open(page, `/anime/${first.slug}`)
  await expect(
    page.getByRole('heading', { name: `Browse One ${stamp}` }),
  ).toBeVisible()
  await expect(page.getByText('Relations')).toBeVisible()
  await expect(page.getByText(`Browse Two ${stamp}`)).toBeVisible()
  await expect(page.getByText(/prequel/i)).toBeVisible()

  await open(page, `/anime/${second.slug}`)
  await expect(page.getByText(/sequel/i)).toBeVisible()
})
