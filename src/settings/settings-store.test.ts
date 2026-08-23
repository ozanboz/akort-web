import { get } from 'svelte/store'
import { describe, expect, it } from 'vitest'
import { createSettingsStore, DEFAULT_SETTINGS, normalizeSettings } from './settings-store'

class MemoryStorage implements Storage {
  private entries = new Map<string, string>()
  get length() { return this.entries.size }
  clear() { this.entries.clear() }
  getItem(key: string) { return this.entries.get(key) ?? null }
  key(index: number) { return [...this.entries.keys()][index] ?? null }
  removeItem(key: string) { this.entries.delete(key) }
  setItem(key: string, value: string) { this.entries.set(key, value) }
}

describe('normalizeSettings', () => {
  it('returns the defaults for unusable input', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('nonsense')).toEqual(DEFAULT_SETTINGS)
  })

  it('clamps the reference frequency into the offered range', () => {
    expect(normalizeSettings({ referenceFrequency: 300 }).referenceFrequency).toBe(415)
    expect(normalizeSettings({ referenceFrequency: 500 }).referenceFrequency).toBe(466)
  })

  it('clamps chromatic transposition indices to the twelve degrees', () => {
    const settings = normalizeSettings({
      chromaticTranspositionFrom: -4,
      chromaticTranspositionTo: 99,
    })
    expect(settings.chromaticTranspositionFrom).toBe(0)
    expect(settings.chromaticTranspositionTo).toBe(11)
  })

  it('clamps koma transposition indices to the seven naturals', () => {
    const settings = normalizeSettings({
      komaTranspositionFrom: -1,
      komaTranspositionTo: 42,
    })
    expect(settings.komaTranspositionFrom).toBe(0)
    expect(settings.komaTranspositionTo).toBe(6)
  })

  it('rejects an unknown tolerance and falls back to the default', () => {
    expect(normalizeSettings({ toleranceCents: 7 }).toleranceCents).toBe(5)
  })

  it('rejects an unknown tuning mode and falls back to the default', () => {
    expect(normalizeSettings({ tuningMode: 'quarter' }).tuningMode).toBe('chromatic')
  })
})

describe('createSettingsStore', () => {
  it('starts from the defaults when storage is empty', () => {
    const store = createSettingsStore(new MemoryStorage())
    expect(get(store)).toEqual(DEFAULT_SETTINGS)
  })

  it('persists every update', () => {
    const storage = new MemoryStorage()
    const store = createSettingsStore(storage)
    store.update((settings) => ({ ...settings, tuningMode: 'koma' }))

    const reloaded = createSettingsStore(storage)
    expect(get(reloaded).tuningMode).toBe('koma')
  })

  it('normalises values written through the store', () => {
    const store = createSettingsStore(new MemoryStorage())
    store.update((settings) => ({ ...settings, referenceFrequency: 999 }))
    expect(get(store).referenceFrequency).toBe(466)
  })

  it('survives corrupted stored JSON', () => {
    const storage = new MemoryStorage()
    storage.setItem('akort.settings', '{ not json')
    expect(get(createSettingsStore(storage))).toEqual(DEFAULT_SETTINGS)
  })
})
