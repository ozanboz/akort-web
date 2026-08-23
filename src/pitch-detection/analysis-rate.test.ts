import { describe, expect, it } from 'vitest'
import { ANALYSIS_RATE_HZ, hopSizeFor, windowSizeFor } from './analysis-rate'

describe('analysis rate', () => {
  it('keeps the window the iOS app analyses at the rates iOS sees', () => {
    expect(windowSizeFor(44100)).toBe(2048)
    expect(windowSizeFor(48000)).toBe(2048)
  })

  // Half the window must hold one period of the lowest pitch, or the low notes
  // simply cannot be found: at 96 kHz a 2048 window bottoms out near 94 Hz.
  it('grows the window when the sample rate would push the floor above 65 Hz', () => {
    expect(windowSizeFor(96000)).toBe(4096)
    expect(windowSizeFor(96000) / 2).toBeGreaterThanOrEqual(96000 / 65)
  })

  // The iOS PitchDetector uses hopSize 1470 at 44.1kHz and says so explicitly:
  // 30 Hz is above what the eye resolves on a needle, and a smaller hop caused
  // real problems there. Reproducing that number is the point of this test.
  it('reproduces the iOS hop at 44.1 kHz', () => {
    expect(hopSizeFor(44100)).toBe(1470)
  })

  it('holds the same rate at 48 kHz, which browsers commonly use', () => {
    expect(hopSizeFor(48000)).toBe(1600)
  })

  it.each([16000, 22050, 44100, 48000, 96000])(
    'analyses at about %i Hz sample rate without drifting off 30 Hz',
    (sampleRate) => {
      const rate = sampleRate / hopSizeFor(sampleRate)
      expect(Math.abs(rate - ANALYSIS_RATE_HZ)).toBeLessThan(0.5)
    },
  )

  it('never hops further than the window it analyses', () => {
    for (const sampleRate of [16000, 44100, 48000, 96000]) {
      expect(hopSizeFor(sampleRate)).toBeLessThanOrEqual(windowSizeFor(sampleRate))
    }
  })
})
