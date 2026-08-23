import { containsFrequency } from './frequency-range'
import type { NoteLabel } from './note-label'
import { octaveAndRemainder } from './octave-math'
import { clampA4, STANDARD_A4 } from './reference-pitch'

export const KOMA_BASE_POSITIONS: ReadonlyArray<{
  turkish: string
  western: string
  position: number
}> = [
  { turkish: 'Do', western: 'C', position: 0 },
  { turkish: 'Re', western: 'D', position: 9 },
  { turkish: 'Mi', western: 'E', position: 18 },
  { turkish: 'Fa', western: 'F', position: 22 },
  { turkish: 'Sol', western: 'G', position: 31 },
  { turkish: 'La', western: 'A', position: 40 },
  { turkish: 'Si', western: 'B', position: 49 },
]

const KOMA_CANDIDATES = [...KOMA_BASE_POSITIONS, { turkish: 'Do', western: 'C', position: 53 }]

const KOMA_POSITION_OF_A4_WITHIN_OCTAVE = 40
const KOMA_POSITION_OF_A4 = 4 * 53 + KOMA_POSITION_OF_A4_WITHIN_OCTAVE
const CENTS_PER_KOMA = 1200 / 53

export function nearestKomaNote(
  frequency: number,
  referenceFrequency: number = STANDARD_A4,
): NoteLabel | null {
  if (!containsFrequency(frequency)) return null

  const komaStepsFromA4 = 53 * Math.log2(frequency / clampA4(referenceFrequency))
  const absoluteKoma = KOMA_POSITION_OF_A4 + komaStepsFromA4
  const nearestIndex = Math.round(absoluteKoma)
  const centsOffset = (absoluteKoma - nearestIndex) * CENTS_PER_KOMA

  return labelForAbsoluteKoma(nearestIndex, centsOffset)
}

export function transposeKoma(label: NoteLabel, steps: number): NoteLabel {
  if (steps === 0) return label

  const withinOctave =
    KOMA_BASE_POSITIONS[label.scalePosition].position + (label.komaOffset ?? 0)
  const absolute = label.octave * 53 + withinOctave + steps

  return labelForAbsoluteKoma(absolute, label.centsOffset)
}

export function komaShift(from: number, to: number): number {
  let shift = KOMA_BASE_POSITIONS[to].position - KOMA_BASE_POSITIONS[from].position
  if (shift > 26) shift -= 53
  if (shift < -26) shift += 53
  return shift
}

function labelForAbsoluteKoma(index: number, centsOffset: number): NoteLabel {
  const { octave: octaveOffset, remainder: komaWithinOctave } = octaveAndRemainder(index, 53)
  let octave = octaveOffset

  // On an exact tie the earlier-listed (lower) natural wins. Deliberate, not
  // incidental: it keeps Mi/Fa and Si/Do ties from depending on array order.
  let bestIndex = 0
  for (let candidate = 1; candidate < KOMA_CANDIDATES.length; candidate += 1) {
    const current = Math.abs(komaWithinOctave - KOMA_CANDIDATES[candidate].position)
    const best = Math.abs(komaWithinOctave - KOMA_CANDIDATES[bestIndex].position)
    if (current < best) bestIndex = candidate
  }

  const best = KOMA_CANDIDATES[bestIndex]
  const komaOffset = komaWithinOctave - best.position
  if (best.position === 53) octave += 1

  // The wrap candidate is the next octave's Do, naming the first natural again.
  const scalePosition = bestIndex === KOMA_CANDIDATES.length - 1 ? 0 : bestIndex

  return {
    turkishBaseName: best.turkish,
    westernBaseName: best.western,
    octave,
    komaOffset,
    centsOffset,
    scalePosition,
  }
}
