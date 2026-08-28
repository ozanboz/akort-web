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
  /** Consecutive misses so far; the gauge dims once these pass the threshold. */
  missedFrames: number
  /**
   * The frequency the reading was derived from, kept so it can be derived again
   * with different settings while nothing is sounding. Putting the instrument
   * down to reach the panel is the normal way to use it, and carrying the old
   * labels through unchanged would freeze the note and the needle while the
   * strip and the badge updated around them.
   */
  frequency: number | null
}

// Individual YIN windows routinely miss during vibrato, decay and between
// plucks. Dimming on the first one made the whole readout flicker. At the 30 Hz
// analysis rate eleven misses is a ~363ms hold -- long enough to ride out a
// dropped pluck, short enough to still read as "stopped playing" promptly.
// Ported from TunerViewModel.signalLossThreshold.
export const SIGNAL_LOSS_THRESHOLD = 11

export const NO_SIGNAL_STATE: DisplayState = {
  label: '—',
  centsOffset: 0,
  isInTune: false,
  hasSignal: false,
  scalePosition: null,
  komaOffset: null,
  missedFrames: SIGNAL_LOSS_THRESHOLD,
  frequency: null,
}

export function deriveDisplayState(
  frequency: number | null,
  settings: Settings,
  previous: DisplayState,
): DisplayState {
  const sounding = frequency === null ? null : findNote(frequency, settings)

  if (sounding === null) {
    // Clamped rather than left to grow: nothing reads it past the threshold,
    // and a counter climbing at 30 a second forever is just noise in the state.
    const missedFrames = Math.min(previous.missedFrames + 1, SIGNAL_LOSS_THRESHOLD)
    const hasSignal = previous.hasSignal && missedFrames < SIGNAL_LOSS_THRESHOLD
    const held = previous.frequency === null ? null : findNote(previous.frequency, settings)
    if (held === null) return { ...previous, missedFrames, hasSignal }

    return { ...reading(held, settings), hasSignal, missedFrames, frequency: previous.frequency }
  }

  return { ...reading(sounding, settings), hasSignal: true, missedFrames: 0, frequency }
}

function reading(note: NoteLabel, settings: Settings) {
  const shifted = applyTransposition(note, settings)

  return {
    label: displayName(shifted, settings.noteNaming),
    centsOffset: shifted.centsOffset,
    isInTune: Math.abs(shifted.centsOffset) <= settings.toleranceCents,
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
