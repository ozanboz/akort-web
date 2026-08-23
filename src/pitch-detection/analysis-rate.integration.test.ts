import { describe, expect, it } from 'vitest'
import { hopSizeFor, windowSizeFor } from './analysis-rate'
import { PitchStabilizer } from './pitch-stabilizer'
import { SlidingWindowBuffer } from './sliding-window-buffer'
import { estimateFrequency } from './yin'

const SAMPLE_RATE = 48000
const FREQUENCY = 440

// A steady note as a room microphone delivers it: the fundamental, a second
// harmonic, and broadband noise. Amplitude is constant on purpose, so anything
// the readings do is jitter rather than the tuner correctly tracking a change.
function noisyTone(seconds: number): Float32Array {
  const samples = new Float32Array(SAMPLE_RATE * seconds)
  let seed = 7
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let index = 0; index < samples.length; index += 1) {
    const t = index / SAMPLE_RATE
    const tone =
      Math.sin(2 * Math.PI * FREQUENCY * t) + 0.35 * Math.sin(2 * Math.PI * 2 * FREQUENCY * t)
    samples[index] = tone * 0.5 + 0.25 * (random() * 2 - 1)
  }
  return samples
}

// Runs the real pipeline -- windowing, YIN, stabiliser -- and reports how far
// the stabilised readings scatter, in cents.
function jitterCents(hopSize: number, signal: Float32Array): number {
  const buffer = new SlidingWindowBuffer(windowSizeFor(SAMPLE_RATE), hopSize)
  const stabilizer = new PitchStabilizer()
  const readings: number[] = []

  const chunk = 128
  for (let offset = 0; offset + chunk <= signal.length; offset += chunk) {
    for (const window of buffer.append(signal.subarray(offset, offset + chunk))) {
      const stabilized = stabilizer.stabilize(estimateFrequency(window, { sampleRate: SAMPLE_RATE }))
      if (stabilized !== null) readings.push(stabilized)
    }
  }

  // Drop the seeding frames: the stabiliser starts from the first estimate.
  const settled = readings.slice(Math.floor(readings.length / 3))
  const cents = settled.map((hz) => 1200 * Math.log2(hz / FREQUENCY))
  return Math.max(...cents) - Math.min(...cents)
}

describe('analysis rate against a noisy signal', () => {
  const signal = noisyTone(6)

  // PitchStabilizer's constants are per frame, not per second: five frames is
  // "about 165ms of history" only at 30 Hz. Analysing at 70 Hz shrinks both the
  // median window and the smoothing time constant in proportion, which is what
  // made the web needle restless next to the phone.
  it('is markedly steadier at the rate the stabiliser was tuned for', () => {
    const atTunedRate = jitterCents(hopSizeFor(SAMPLE_RATE), signal)
    const atDoubleRate = jitterCents(683, signal)

    expect(atTunedRate).toBeLessThan(atDoubleRate * 0.8)
  })

  it('keeps a steady note inside a koma', () => {
    // One koma is 22.64 cents. A tuner whose needle wanders further than that
    // on a held note cannot be used to place koma-accurate pitches.
    expect(jitterCents(hopSizeFor(SAMPLE_RATE), signal)).toBeLessThan(22.64)
  })
})
