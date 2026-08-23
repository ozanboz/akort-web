import { expect, test, type Page } from '@playwright/test'

// Chromium plays e2e/fixtures/a4-440.wav into the capture track, so these cover
// the whole browser chain -- getUserMedia, the capture worklet, the worker
// running YIN, the stabiliser and the DOM -- not just that the page boots.

const PHONE = { width: 390, height: 844 }
const DESKTOP = { width: 1280, height: 800 }

async function startTuning(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Akort+' })).toBeVisible()
  await page.getByRole('button', { name: 'Akorda başla' }).click()
  await expect(page.getByRole('img', { name: 'Akort göstergesi' })).toBeVisible()
}

test('reads the fed 440 Hz tone as A4, in tune', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.setViewportSize(PHONE)
  await startTuning(page)

  const gauge = page.getByRole('img', { name: 'Akort göstergesi' })
  await expect(gauge).not.toHaveClass(/dimmed/, { timeout: 15_000 })

  // Turkish naming is the default, so concert A reads as La4.
  await expect(page.getByText('La4', { exact: true })).toBeVisible({ timeout: 15_000 })

  const cents = await page.locator('.status span').innerText()
  expect(Math.abs(Number.parseFloat(cents.replace('−', '-')))).toBeLessThan(5)

  await expect(page.getByRole('button', { name: 'Kromatik' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Koma' })).toBeVisible()

  expect(pageErrors).toEqual([])
})

test('folds settings behind a toggle on a phone', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await startTuning(page)

  const naming = page.getByRole('group', { name: 'Nota adlandırma' })
  await expect(naming).toBeHidden()

  await page.getByRole('button', { name: 'Ayarlar' }).click()
  await expect(naming).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Koma aktarımı — çalınan nota' })).toBeVisible()
})

test('keeps settings open beside the tuner on a wide screen', async ({ page }) => {
  await page.setViewportSize(DESKTOP)
  await startTuning(page)

  await expect(page.getByRole('group', { name: 'Nota adlandırma' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Tolerans' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ayarlar' })).toBeHidden()
})

test('switches the note strip between chromatic and koma alphabets', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await startTuning(page)

  const strip = page.getByRole('list')
  await expect(strip.getByText('Do♯', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Koma' }).click()
  await expect(strip.getByText('Do♯', { exact: true })).toBeHidden()
  await expect(strip.getByText('Sol', { exact: true })).toBeVisible()
})
