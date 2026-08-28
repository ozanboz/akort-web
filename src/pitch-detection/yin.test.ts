import { describe, expect, it } from 'vitest'
import { estimateFrequency } from './yin'

const SAMPLE_RATE = 44100

function sine(frequency: number, length: number, sampleRate = SAMPLE_RATE): Float32Array {
  const samples = new Float32Array(length)
  for (let index = 0; index < length; index += 1) {
    samples[index] = Math.sin((2 * Math.PI * frequency * index) / sampleRate)
  }
  return samples
}

function noise(length: number, seed = 1): Float32Array {
  const samples = new Float32Array(length)
  let state = seed
  for (let index = 0; index < length; index += 1) {
    state = (state * 1103515245 + 12345) % 2147483648
    samples[index] = (state / 2147483648) * 2 - 1
  }
  return samples
}

describe('estimateFrequency', () => {
  it('recovers concert A within a cent', () => {
    const detected = estimateFrequency(sine(440, 4096), SAMPLE_RATE)!
    expect(1200 * Math.log2(detected / 440)).toBeCloseTo(0, 0)
  })

  it('recovers a low bass note near the range floor', () => {
    const detected = estimateFrequency(sine(82.41, 4096), SAMPLE_RATE)!
    expect(1200 * Math.log2(detected / 82.41)).toBeCloseTo(0, 0)
  })

  // Looser than the low and middle cases on purpose: at 1760 Hz one period is
  // only 25 samples, so parabolic interpolation has far less to work with. The
  // Swift suite allows the same proportional error (2 Hz at 440, 4 Hz at 880,
  // both about 7.9 cents).
  it('recovers a high note near the range ceiling', () => {
    const detected = estimateFrequency(sine(1760, 4096), SAMPLE_RATE)!
    expect(Math.abs(1200 * Math.log2(detected / 1760))).toBeLessThan(5)
  })

  it('does not drop an octave when a harmonic is present', () => {
    const fundamental = sine(220, 4096)
    const harmonic = sine(440, 4096)
    const mixed = new Float32Array(4096)
    for (let index = 0; index < mixed.length; index += 1) {
      mixed[index] = fundamental[index] + 0.8 * harmonic[index]
    }

    const detected = estimateFrequency(mixed, SAMPLE_RATE)!
    expect(1200 * Math.log2(detected / 220)).toBeCloseTo(0, 0)
  })

  it('returns null for white noise', () => {
    expect(estimateFrequency(noise(4096), SAMPLE_RATE)).toBeNull()
  })

  it('returns null for silence', () => {
    expect(estimateFrequency(new Float32Array(4096), SAMPLE_RATE)).toBeNull()
  })

  it('returns null for a window too short to hold the lowest period', () => {
    expect(estimateFrequency(sine(440, 64), SAMPLE_RATE)).toBeNull()
  })

  // Without parabolic interpolation the nearest whole tau at A4 quantises to
  // roughly 17 cents, which is most of a 22.64-cent koma.
  it('beats whole-sample quantisation through interpolation', () => {
    const detected = estimateFrequency(sine(443, 4096), SAMPLE_RATE)!
    expect(Math.abs(1200 * Math.log2(detected / 443))).toBeLessThan(3)
  })
})
