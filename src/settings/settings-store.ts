import { writable, type Writable } from 'svelte/store'
import type { NoteNaming } from '../note-systems/note-label'
import { clampA4 } from '../note-systems/reference-pitch'

export type TuningMode = 'chromatic' | 'koma'
export type ToleranceCents = 3 | 5 | 10

export interface Settings {
  tuningMode: TuningMode
  noteNaming: NoteNaming
  referenceFrequency: number
  toleranceCents: ToleranceCents
  chromaticTranspositionFrom: number
  chromaticTranspositionTo: number
  komaTranspositionFrom: number
  komaTranspositionTo: number
}

const STORAGE_KEY = 'akort.settings'

// Both transposition ends are user-chosen rather than anchored to A: anchored,
// the seven naturals cannot express intervals such as the 13-koma "bir bucuk
// ses" at all. Defaults are A to A, meaning no shift.
export const DEFAULT_SETTINGS: Settings = {
  tuningMode: 'chromatic',
  noteNaming: 'turkish',
  referenceFrequency: 440,
  toleranceCents: 5,
  chromaticTranspositionFrom: 9,
  chromaticTranspositionTo: 9,
  komaTranspositionFrom: 5,
  komaTranspositionTo: 5,
}

const TOLERANCES: ToleranceCents[] = [3, 5, 10]

export function normalizeSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTINGS }
  const source = raw as Partial<Settings>

  return {
    tuningMode: source.tuningMode === 'koma' ? 'koma' : 'chromatic',
    noteNaming: source.noteNaming === 'western' ? 'western' : 'turkish',
    referenceFrequency: clampA4(
      typeof source.referenceFrequency === 'number'
        ? source.referenceFrequency
        : DEFAULT_SETTINGS.referenceFrequency,
    ),
    toleranceCents: TOLERANCES.includes(source.toleranceCents as ToleranceCents)
      ? (source.toleranceCents as ToleranceCents)
      : DEFAULT_SETTINGS.toleranceCents,
    chromaticTranspositionFrom: clampIndex(source.chromaticTranspositionFrom, 11, 9),
    chromaticTranspositionTo: clampIndex(source.chromaticTranspositionTo, 11, 9),
    komaTranspositionFrom: clampIndex(source.komaTranspositionFrom, 6, 5),
    komaTranspositionTo: clampIndex(source.komaTranspositionTo, 6, 5),
  }
}

export function createSettingsStore(storage?: Storage): Writable<Settings> {
  const backing = storage ?? safeLocalStorage()
  const store = writable(normalizeSettings(read(backing)))

  const persist = (settings: Settings) => {
    try {
      backing?.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Private browsing and storage-blocked contexts throw on write. Settings
      // still work for this session; only persistence is lost.
    }
  }

  return {
    subscribe: store.subscribe,
    set: (value) => {
      const normalized = normalizeSettings(value)
      persist(normalized)
      store.set(normalized)
    },
    update: (updater) =>
      store.update((current) => {
        const normalized = normalizeSettings(updater(current))
        persist(normalized)
        return normalized
      }),
  }
}

function clampIndex(value: unknown, maximum: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.round(value), 0), maximum)
}

function read(storage: Storage | undefined): unknown {
  try {
    const stored = storage?.getItem(STORAGE_KEY)
    return stored === null || stored === undefined ? null : JSON.parse(stored)
  } catch {
    return null
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}
