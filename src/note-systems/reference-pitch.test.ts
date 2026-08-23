import { describe, expect, it } from 'vitest'
import {
  clampA4,
  frequencyForKomaStepsFromA4,
  frequencyForSemitonesFromA4,
  MAX_A4,
  MIN_A4,
  STANDARD_A4,
} from './reference-pitch'

describe('clampA4', () => {
  it('passes values inside the offered range through unchanged', () => {
    expect(clampA4(442)).toBe(442)
  })

  it('clamps below the baroque end', () => {
    expect(clampA4(300)).toBe(MIN_A4)
  })

  it('clamps above the sharp orchestral end', () => {
    expect(clampA4(500)).toBe(MAX_A4)
  })

  it('falls back to concert pitch for non-finite input', () => {
    expect(clampA4(Number.NaN)).toBe(STANDARD_A4)
  })
})

describe('frequency helpers', () => {
  it('places an octave above A4 at 880 Hz', () => {
    expect(frequencyForSemitonesFromA4(12)).toBeCloseTo(880, 6)
  })

  it('places 53 komas above A4 at 880 Hz', () => {
    expect(frequencyForKomaStepsFromA4(53)).toBeCloseTo(880, 6)
  })

  it('honours a non-standard reference', () => {
    expect(frequencyForSemitonesFromA4(0, 442)).toBeCloseTo(442, 6)
  })
})
