import { containsFrequency } from './frequency-range'
import type { NoteLabel } from './note-label'
import { octaveAndRemainder } from './octave-math'
import { clampA4, STANDARD_A4 } from './reference-pitch'

// Turkish keeps the spoken long form here because this is the label read at a
// glance; the note strip abbreviates it only because twelve cells have to fit
// across a phone.
const CHROMATIC_NAMES: Array<{ turkish: string; western: string }> = [
  { turkish: 'Do', western: 'C' },
  { turkish: 'Do diyez', western: 'C♯' },
  { turkish: 'Re', western: 'D' },
  { turkish: 'Re diyez', western: 'D♯' },
  { turkish: 'Mi', western: 'E' },
  { turkish: 'Fa', western: 'F' },
  { turkish: 'Fa diyez', western: 'F♯' },
  { turkish: 'Sol', western: 'G' },
  { turkish: 'Sol diyez', western: 'G♯' },
  { turkish: 'La', western: 'A' },
  { turkish: 'La diyez', western: 'A♯' },
  { turkish: 'Si', western: 'B' },
]

const SEMITONES_FROM_C_TO_A = 9

export function nearestChromaticNote(
  frequency: number,
  referenceFrequency: number = STANDARD_A4,
): NoteLabel | null {
  if (!containsFrequency(frequency)) return null

  const semitonesFromA4 = 12 * Math.log2(frequency / clampA4(referenceFrequency))
  const roundedSemitones = Math.round(semitonesFromA4)
  const centsOffset = (semitonesFromA4 - roundedSemitones) * 100

  const semitoneIndexFromC4 = roundedSemitones + SEMITONES_FROM_C_TO_A
  const { octave, remainder } = octaveAndRemainder(semitoneIndexFromC4, 12)
  const names = CHROMATIC_NAMES[remainder]

  return {
    turkishBaseName: names.turkish,
    westernBaseName: names.western,
    octave: 4 + octave,
    komaOffset: null,
    centsOffset,
    scalePosition: remainder,
  }
}

export function transposeChromatic(label: NoteLabel, steps: number): NoteLabel {
  if (steps === 0) return label

  const absolute = label.octave * 12 + label.scalePosition + steps
  const { octave, remainder } = octaveAndRemainder(absolute, 12)
  const names = CHROMATIC_NAMES[remainder]

  return {
    turkishBaseName: names.turkish,
    westernBaseName: names.western,
    octave,
    komaOffset: null,
    centsOffset: label.centsOffset,
    scalePosition: remainder,
  }
}

export function chromaticSemitoneShift(from: number, to: number): number {
  let shift = to - from
  if (shift > 6) shift -= 12
  if (shift < -6) shift += 12
  return shift
}
