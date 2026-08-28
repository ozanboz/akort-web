import { describe, expect, it } from 'vitest'
import { PitchStabilizer } from '../pitch-detection/pitch-stabilizer'
import { DEFAULT_SETTINGS, type Settings } from '../settings/settings-store'
import { deriveDisplayState, NO_SIGNAL_STATE, SIGNAL_LOSS_THRESHOLD } from './display-state'

const chromatic: Settings = { ...DEFAULT_SETTINGS, noteNaming: 'western' }

// The bug this guards lived in the seam, not on either side of it. Both
// PitchStabilizer and deriveDisplayState hold the reading through a dropout,
// and the stabiliser used to hold by answering with the last frequency. The
// display therefore never saw a miss, its counter never advanced, and the
// readout never dimmed -- while the unit tests on both sides passed throughout.
describe('the stabiliser and the display together', () => {
  it('dims once the player stops', () => {
    const stabilizer = new PitchStabilizer()
    let state = deriveDisplayState(stabilizer.stabilize(440), chromatic, NO_SIGNAL_STATE)

    for (let frame = 0; frame < SIGNAL_LOSS_THRESHOLD; frame += 1) {
      expect(state.hasSignal).toBe(true)
      state = deriveDisplayState(stabilizer.stabilize(null), chromatic, state)
    }

    expect(state.hasSignal).toBe(false)
    expect(state.label).toBe('A4')
  })

  it('lights up again when the note returns', () => {
    const stabilizer = new PitchStabilizer()
    let state = deriveDisplayState(stabilizer.stabilize(440), chromatic, NO_SIGNAL_STATE)
    for (let frame = 0; frame < 60; frame += 1) {
      state = deriveDisplayState(stabilizer.stabilize(null), chromatic, state)
    }
    expect(state.hasSignal).toBe(false)

    state = deriveDisplayState(stabilizer.stabilize(440), chromatic, state)
    expect(state.hasSignal).toBe(true)
    expect(state.missedFrames).toBe(0)
    expect(state.label).toBe('A4')
  })
})
