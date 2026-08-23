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

  // Poll rather than read once: the stabiliser seeds on the first estimate,
  // which spans the silence-to-tone edge, and needs a few frames at 30 Hz to
  // settle onto the real pitch.
  await expect
    .poll(async () => {
      const cents = await page.locator('.status span').innerText()
      return Math.abs(Number.parseFloat(cents.replace('−', '-')))
    }, { timeout: 10_000 })
    .toBeLessThan(5)

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

test('keeps the readout height when a long koma label appears', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await startTuning(page)

  const stage = page.locator('.stage')
  await expect(page.getByText('La4', { exact: true })).toBeVisible({ timeout: 15_000 })
  const before = await stage.boundingBox()

  await page.getByRole('button', { name: 'Koma' }).click()
  await page.getByRole('button', { name: 'Ayarlar' }).click()
  await page.getByRole('combobox', { name: 'Koma aktarımı — çalınan nota' }).selectOption({ label: 'Do' })
  await page.getByRole('combobox', { name: 'Koma aktarımı — duyulan ses' }).selectOption({ label: 'Si' })
  await page.getByRole('button', { name: 'Ayarları kapat' }).click()

  // Transposing by -4 komas renames concert A as "La bemol 4 (4)" -- long
  // enough to have wrapped before the label was scaled to fit.
  await expect(page.locator('.note')).toContainText('bemol', { timeout: 15_000 })

  const after = await stage.boundingBox()
  expect(after?.height).toBeCloseTo(before?.height ?? 0, 0)
})

test('holds the needle steady on a constant tone', async ({ page }) => {
  await page.setViewportSize(PHONE)
  await startTuning(page)
  await expect(page.getByText('La4', { exact: true })).toBeVisible({ timeout: 15_000 })

  // The fixture is a pure 440 Hz sine, so a correctly damped needle should sit
  // still. Sampling the rotation directly measures the jitter the stabiliser is
  // there to remove -- it caught an analysis rate running at 70 Hz while the
  // stabiliser's constants assumed 30.
  const angles = await page.evaluate(async () => {
    const needle = document.querySelector('.needle') as SVGElement
    const read = () => Number.parseFloat(needle.style.transform.replace(/[^\d.-]/g, '')) || 0
    // Let the stabiliser settle first; the seeding frames are not what this
    // measures.
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const samples: number[] = []
    for (let i = 0; i < 60; i += 1) {
      samples.push(read())
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    return samples
  })

  const spread = Math.max(...angles) - Math.min(...angles)
  console.log(`needle spread: ${spread.toFixed(4)} deg over ${angles.length} samples`)
  // One degree of sweep is 0.56 cents; a steady tone must stay well inside that.
  expect(spread).toBeLessThan(1)
})
