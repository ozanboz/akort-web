import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings-store'
import { deriveDisplayState, NO_SIGNAL_STATE } from './display-state'

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

  it('holds the previous reading through a dropout', () => {
    const reading = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    const held = deriveDisplayState(null, chromatic, reading)
    expect(held.label).toBe('A4')
    expect(held.hasSignal).toBe(false)
  })

  it('reports no signal before any reading has arrived', () => {
    expect(deriveDisplayState(null, chromatic, NO_SIGNAL_STATE)).toEqual(NO_SIGNAL_STATE)
  })

  it('holds the previous reading when a frequency falls outside the range', () => {
    const reading = deriveDisplayState(440, chromatic, NO_SIGNAL_STATE)
    const held = deriveDisplayState(5000, chromatic, reading)
    expect(held.label).toBe('A4')
    expect(held.hasSignal).toBe(false)
  })
})
