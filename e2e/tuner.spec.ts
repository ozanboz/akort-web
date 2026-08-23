import { expect, test } from '@playwright/test'

test('starts listening and renders a reading', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Akorda başla' }).click()

  const gauge = page.getByRole('img', { name: 'Akort göstergesi' })
  await expect(gauge).toBeVisible()
  await expect(gauge).not.toHaveClass(/dimmed/, { timeout: 10_000 })
})
