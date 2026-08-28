// The band the tuner claims to cover, shared by everything that has to agree on
// it: YIN's search bounds, the analysis window size, and the note grids' guard.
// Two of those three used to keep private copies of 65 -- a default parameter
// in yin.ts and LOWEST_FREQUENCY in analysis-rate.ts -- which would have let
// YIN hunt for pitches the grids then discarded, or sized a window too short to
// hold the period YIN was looking for.
export const MIN_FREQUENCY = 65
export const MAX_FREQUENCY = 2000

export function containsFrequency(frequency: number): boolean {
  return frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY
}
