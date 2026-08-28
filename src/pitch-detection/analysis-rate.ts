import { MIN_FREQUENCY } from '../note-systems/frequency-range'

export const ANALYSIS_RATE_HZ = 30

const MINIMUM_WINDOW = 2048

// YIN compares the window against itself, so half of it must hold one period of
// the lowest pitch we claim to detect. A fixed 2048 stops reaching 65 Hz above
// about 66 kHz -- fine on iOS, which is handed 44.1 or 48 kHz, but a browser
// takes whatever the device offers.
export function windowSizeFor(sampleRate: number): number {
  const needed = 2 * (sampleRate / MIN_FREQUENCY)
  let size = MINIMUM_WINDOW
  while (size < needed) size *= 2
  return size
}

// The iOS app hops 1470 samples at 44.1kHz and documents why: 30 Hz is already
// above what the eye resolves on a needle, and a smaller hop (512, ~86 Hz)
// starved the audio thread there. The rate matters beyond the audio, because
// PitchStabilizer's constants are per frame rather than per second -- its
// five-frame median is "about 165ms of history" only at 30 Hz. Analysing faster
// shortens both the median window and the smoothing time constant in
// proportion, which is what made the web needle restless.
export function hopSizeFor(sampleRate: number): number {
  return Math.min(windowSizeFor(sampleRate), Math.round(sampleRate / ANALYSIS_RATE_HZ))
}
