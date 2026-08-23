export interface YinOptions {
  sampleRate: number
  minFrequency?: number
  maxFrequency?: number
  threshold?: number
  fallbackConfidenceCeiling?: number
}

// Loosened from the paper's 0.15 to tolerate quieter playing: CMNDF is
// amplitude-invariant in theory, but a quiet signal's SNR against the mic's
// noise floor degrades and its dip often fails a stricter threshold.
const DEFAULT_THRESHOLD = 0.25

// The YIN paper's own step-3 fallback: rather than reporting "no pitch" when
// nothing clears the threshold, retry with a looser ceiling. True noise still
// fails, its CMNDF hovering near 1.
const DEFAULT_FALLBACK_CONFIDENCE_CEILING = 0.5

export function estimateFrequency(samples: Float32Array, options: YinOptions): number | null {
  const {
    sampleRate,
    minFrequency = 65,
    maxFrequency = 2000,
    threshold = DEFAULT_THRESHOLD,
    fallbackConfidenceCeiling = DEFAULT_FALLBACK_CONFIDENCE_CEILING,
  } = options

  const length = samples.length
  const maxTau = Math.min(Math.floor(length / 2), Math.floor(sampleRate / minFrequency))
  const minTau = Math.max(2, Math.floor(sampleRate / maxFrequency))
  if (maxTau <= minTau || length <= maxTau) return null

  const difference = new Float64Array(maxTau + 1)
  const window = length - maxTau
  for (let tau = 1; tau <= maxTau; tau += 1) {
    let sum = 0
    for (let index = 0; index < window; index += 1) {
      const delta = samples[index] - samples[index + tau]
      sum += delta * delta
    }
    difference[tau] = sum
  }

  const cmndf = new Float64Array(maxTau + 1).fill(1)
  let runningSum = 0
  for (let tau = 1; tau <= maxTau; tau += 1) {
    runningSum += difference[tau]
    cmndf[tau] = runningSum > 1e-12 ? (difference[tau] * tau) / runningSum : 1
  }

  const bestTau =
    firstDip(cmndf, threshold, minTau, maxTau) ??
    firstDip(cmndf, fallbackConfidenceCeiling, minTau, maxTau)
  if (bestTau === null) return null

  const refinedTau = interpolate(cmndf, bestTau, minTau, maxTau)
  return refinedTau > 0 ? sampleRate / refinedTau : null
}

// Scanning smallest-tau-first doubles as octave-down protection: a subharmonic
// at twice the true period never wins over the true period when both qualify.
// Taking the raw array minimum instead would pick spuriously small CMNDF values
// near maxTau that have nothing to do with periodicity.
function firstDip(
  cmndf: Float64Array,
  ceiling: number,
  minTau: number,
  maxTau: number,
): number | null {
  for (let tau = minTau; tau <= maxTau; tau += 1) {
    if (cmndf[tau] >= ceiling) continue

    let localTau = tau
    while (localTau + 1 <= maxTau && cmndf[localTau + 1] < cmndf[localTau]) {
      localTau += 1
    }
    return localTau
  }
  return null
}

function interpolate(
  cmndf: Float64Array,
  bestTau: number,
  minTau: number,
  maxTau: number,
): number {
  const lower = bestTau > minTau ? bestTau - 1 : bestTau
  const upper = bestTau < maxTau ? bestTau + 1 : bestTau
  if (lower === bestTau || upper === bestTau) return bestTau

  const denominator = 2 * cmndf[bestTau] - cmndf[upper] - cmndf[lower]
  if (Math.abs(denominator) <= 1e-12) return bestTau

  // Clamped to the standard half-sample range: an unbounded correction pushes
  // the result far outside the bracket when the denominator is small.
  const correction = (cmndf[upper] - cmndf[lower]) / (2 * denominator)
  return bestTau + Math.min(0.5, Math.max(-0.5, correction))
}
