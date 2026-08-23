import {
  chromaticSemitoneShift,
  nearestChromaticNote,
  transposeChromatic,
} from '../note-systems/chromatic-grid'
import { komaShift, nearestKomaNote, transposeKoma } from '../note-systems/koma-grid'
import { displayName, type NoteLabel } from '../note-systems/note-label'
import type { Settings } from '../settings/settings-store'

export interface DisplayState {
  label: string
  centsOffset: number
  isInTune: boolean
  hasSignal: boolean
  scalePosition: number | null
  komaOffset: number | null
}

export const NO_SIGNAL_STATE: DisplayState = {
  label: '—',
  centsOffset: 0,
  isInTune: false,
  hasSignal: false,
  scalePosition: null,
  komaOffset: null,
}

// A missed frame dims the gauge rather than clearing it: single YIN windows
// routinely miss during vibrato and decay, and resetting on each one made the
// note flash instead of read continuously.
export function deriveDisplayState(
  frequency: number | null,
  settings: Settings,
  previous: DisplayState,
): DisplayState {
  const note = frequency === null ? null : findNote(frequency, settings)
  if (note === null) return { ...previous, hasSignal: false }

  const shifted = applyTransposition(note, settings)

  return {
    label: displayName(shifted, settings.noteNaming),
    centsOffset: shifted.centsOffset,
    isInTune: Math.abs(shifted.centsOffset) <= settings.toleranceCents,
    hasSignal: true,
    scalePosition: shifted.scalePosition,
    komaOffset: shifted.komaOffset,
  }
}

function findNote(frequency: number, settings: Settings): NoteLabel | null {
  return settings.tuningMode === 'koma'
    ? nearestKomaNote(frequency, settings.referenceFrequency)
    : nearestChromaticNote(frequency, settings.referenceFrequency)
}

function applyTransposition(note: NoteLabel, settings: Settings): NoteLabel {
  if (settings.tuningMode === 'koma') {
    const steps = komaShift(settings.komaTranspositionFrom, settings.komaTranspositionTo)
    return transposeKoma(note, steps)
  }

  const steps = chromaticSemitoneShift(
    settings.chromaticTranspositionFrom,
    settings.chromaticTranspositionTo,
  )
  return transposeChromatic(note, steps)
}
