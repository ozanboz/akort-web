import type { NoteNaming } from './note-label'

const TURKISH_CHROMATIC = [
  'Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa',
  'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si',
]

const WESTERN_CHROMATIC = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F',
  'F♯', 'G', 'G♯', 'A', 'A♯', 'B',
]

const TURKISH_NATURALS = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']
const WESTERN_NATURALS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

const ACCIDENTAL_INDICES = new Set([1, 3, 6, 8, 10])

export function chromaticAlphabet(naming: NoteNaming): string[] {
  return naming === 'turkish' ? TURKISH_CHROMATIC : WESTERN_CHROMATIC
}

export function naturalAlphabet(naming: NoteNaming): string[] {
  return naming === 'turkish' ? TURKISH_NATURALS : WESTERN_NATURALS
}

export function isAccidental(chromaticIndex: number): boolean {
  return ACCIDENTAL_INDICES.has(chromaticIndex)
}
