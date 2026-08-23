import { expect, test } from '@playwright/test'

// Scope note: this cannot assert a detected pitch. Chromium delivers a silent
// capture track on this setup -- both with its built-in fake device and with a
// fed WAV file, in the headless shell and in full Chromium alike (measured peak
// amplitude 0). What it does cover is that the page boots, the permission gate
// works, and the audio graph starts without throwing. The DSP itself is covered
// by unit tests against synthetic waves; the browser wiring needs a real device.
test('boots, grants the microphone and reaches the listening state', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Akort+' })).toBeVisible()

  await page.getByRole('button', { name: 'Akorda başla' }).click()

  await expect(page.getByRole('img', { name: 'Akort göstergesi' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kromatik' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeVisible()

  expect(pageErrors).toEqual([])
})

test('shows the settings panel with both transposition modes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Akorda başla' }).click()
  await page.getByRole('button', { name: 'Ayarlar' }).click()

  await expect(page.getByRole('group', { name: 'Aktarım — kromatik' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Aktarım — koma' })).toBeVisible()
})
