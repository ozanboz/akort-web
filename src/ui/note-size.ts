// Koma labels in Turkish run long -- "Sol bemol 12 (4)" against "La4" -- and at
// full size they wrapped, which changed the readout's height and shunted
// everything below it up and down on almost every reading. Shrinking to fit is
// what the iOS app does (lineLimit 1, minimumScaleFactor 0.6).
const FITS_AT_FULL_SIZE = 10
const MINIMUM_SCALE = 0.45

export function noteScaleFor(label: string): number {
  if (label.length <= FITS_AT_FULL_SIZE) return 1
  return Math.max(MINIMUM_SCALE, FITS_AT_FULL_SIZE / label.length)
}
