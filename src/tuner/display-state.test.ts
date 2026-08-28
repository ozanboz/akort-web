import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings-store'
import { deriveDisplayState, NO_SIGNAL_STATE, SIGNAL_LOSS_THRESHOLD } from './display-state'

const chromatic: Settings = { ...DEFAULT_SETTINGS, noteNaming: 'western' }
const koma: Settings = { ...chromatic, tuningMode: 'koma' }

describe('deriveDisplayState', () => {
  it('names a chromatic reading and marks it in tune', () => {
    const state = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    expect(state.label).toBe('A4')
    expect(state.isInTune).toBe(true)
    expect(state.hasSignal).toBe(true)
    expect(state.scalePosition).toBe(9)
    expect(state.komaOffset).toBeNull()
  })

  it('marks a reading outside the tolerance as out of tune', () => {
    const state = deriveDisplayState(450, chromatic, NO_SIGNAL_STATE)
    expect(state.isInTune).toBe(false)
    expect(state.centsOffset).toBeCloseTo(38.91, 1)
  })

  it('honours a tighter tolerance setting', () => {
    const tight: Settings = { ...chromatic, toleranceCents: 3 }
    const at4Cents = 440 * 2 ** (4 / 1200)
    expect(deriveDisplayState(at4Cents, chromatic, NO_SIGNAL_STATE).isInTune).toBe(true)
    expect(deriveDisplayState(at4Cents, tight, NO_SIGNAL_STATE).isInTune).toBe(false)
  })

  it('names a koma reading with its offset', () => {
    const state = deriveDisplayState(450, koma, NO_SIGNAL_STATE)
    expect(state.label).toBe('A+2 (4)')
    expect(state.komaOffset).toBe(2)
    expect(state.scalePosition).toBe(5)
  })

  it('applies chromatic transposition to the name but not the cents', () => {
    const transposing: Settings = {
      ...chromatic,
      chromaticTranspositionFrom: 2,
      chromaticTranspositionTo: 11,
    }
    const plain = deriveDisplayState(450, chromatic, NO_SIGNAL_STATE)
    const shifted = deriveDisplayState(450, transposing, NO_SIGNAL_STATE)

    expect(plain.label).toBe('A4')
    expect(shifted.label).toBe('F♯4')
    expect(shifted.centsOffset).toBeCloseTo(plain.centsOffset, 10)
  })

  it('applies koma transposition in komas, not semitones', () => {
    const transposing: Settings = {
      ...koma,
      komaTranspositionFrom: 1,
      komaTranspositionTo: 6,
    }
    const plain = deriveDisplayState(440, koma, NO_SIGNAL_STATE)
    const shifted = deriveDisplayState(440, transposing, NO_SIGNAL_STATE)

    expect(plain.label).toBe('A4')
    expect(shifted.label).not.toBe('A4')
    expect(shifted.centsOffset).toBeCloseTo(plain.centsOffset, 10)
  })

  it('rides out a short dropout without dimming', () => {
    let state = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    for (let frame = 0; frame < SIGNAL_LOSS_THRESHOLD - 1; frame += 1) {
      state = deriveDisplayState(null, chromatic, state)
      expect(state.hasSignal).toBe(true)
      expect(state.label).toBe('A4')
    }
  })

  it('dims once the dropout passes the threshold', () => {
    let state = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    for (let frame = 0; frame < SIGNAL_LOSS_THRESHOLD; frame += 1) {
      state = deriveDisplayState(null, chromatic, state)
    }
    expect(state.hasSignal).toBe(false)
    expect(state.label).toBe('A4')
  })

  it('clears the miss count as soon as a reading returns', () => {
    let state = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    state = deriveDisplayState(null, chromatic, state)
    state = deriveDisplayState(null, chromatic, state)
    state = deriveDisplayState(440, chromatic, state)
    expect(state.missedFrames).toBe(0)
    expect(state.hasSignal).toBe(true)
  })

  it('reports no signal before any reading has arrived', () => {
    expect(deriveDisplayState(null, chromatic, NO_SIGNAL_STATE)).toEqual(NO_SIGNAL_STATE)
  })

  // The held frequency has to stay the one that produced a note. Storing the
  // rejected 5000 instead would make every later miss fail to re-derive, and
  // the labels would freeze against settings changes from then on.
  it('holds the previous reading when a frequency falls outside the range', () => {
    const reading = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    const held = deriveDisplayState(5000, chromatic, reading)
    expect(held.label).toBe('A4')
    expect(held.hasSignal).toBe(true)
    expect(held.missedFrames).toBe(1)

    const turkish: Settings = { ...chromatic, noteNaming: 'turkish' }
    expect(deriveDisplayState(null, turkish, held).label).toBe('La4')
  })

  // Putting the instrument down to reach the settings panel is the normal way
  // to use it, so the readout has to follow a change made while nothing is
  // sounding -- otherwise the note and the needle freeze while the strip and
  // the badge update around them.
  it('follows a settings change while nothing is sounding', () => {
    const turkish: Settings = { ...chromatic, noteNaming: 'turkish' }
    let state = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    state = deriveDisplayState(null, chromatic, state)
    expect(state.label).toBe('A4')

    state = deriveDisplayState(null, turkish, state)
    expect(state.label).toBe('La4')
    expect(state.hasSignal).toBe(true)

    // La (9) to Mi (4) is a five-semitone drop, so concert A is named Mi4.
    const transposed: Settings = {
      ...turkish,
      chromaticTranspositionFrom: 9,
      chromaticTranspositionTo: 4,
    }
    state = deriveDisplayState(null, transposed, state)
    expect(state.label).toBe('Mi4')

    // The needle, not just the name: raising A4 to 442 leaves a held 440 flat
    // by 7.85 cents, which is outside the default 5 cent tolerance.
    const raised: Settings = { ...chromatic, referenceFrequency: 442 }
    state = deriveDisplayState(null, raised, state)
    expect(state.centsOffset).toBeCloseTo(-7.85, 2)
    expect(state.isInTune).toBe(false)
  })

  // NoteStrip indexes its cells by scalePosition and reads komaOffset, so a
  // frozen chromatic position of 9 would highlight nothing on a 7-cell strip.
  it('re-derives the koma fields when the mode changes during silence', () => {
    let state = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    expect(state.scalePosition).toBe(9)
    expect(state.komaOffset).toBeNull()

    state = deriveDisplayState(null, chromatic, state)
    state = deriveDisplayState(null, koma, state)
    expect(state.label).toBe('A4')
    expect(state.scalePosition).toBe(5)
    expect(state.komaOffset).toBe(0)
  })
})
