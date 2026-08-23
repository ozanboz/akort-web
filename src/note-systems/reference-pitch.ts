export const STANDARD_A4 = 440

// The low end covers baroque pitch, the high end the sharp orchestral tunings
// still used in parts of Europe. Turkish makam ensembles commonly sit between.
export const MIN_A4 = 415
export const MAX_A4 = 466

export function clampA4(frequency: number): number {
  if (!Number.isFinite(frequency)) return STANDARD_A4
  return Math.min(Math.max(frequency, MIN_A4), MAX_A4)
}

export function frequencyForSemitonesFromA4(
  semitones: number,
  referenceA4: number = STANDARD_A4,
): number {
  return referenceA4 * 2 ** (semitones / 12)
}

export function frequencyForKomaStepsFromA4(
  komaSteps: number,
  referenceA4: number = STANDARD_A4,
): number {
  return referenceA4 * 2 ** (komaSteps / 53)
}
