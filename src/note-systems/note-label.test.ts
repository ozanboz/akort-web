import { describe, expect, it } from 'vitest'
import { displayName, type NoteLabel } from './note-label'

const natural: NoteLabel = {
  turkishBaseName: 'La',
  westernBaseName: 'A',
  octave: 4,
  komaOffset: 0,
  centsOffset: 0,
  scalePosition: 5,
}

const sharpened: NoteLabel = {
  turkishBaseName: 'Fa',
  westernBaseName: 'F',
  octave: 4,
  komaOffset: 3,
  centsOffset: 0,
  scalePosition: 3,
}

const flattened: NoteLabel = { ...sharpened, komaOffset: -2 }

describe('displayName', () => {
  it('renders a natural note without an accidental suffix', () => {
    expect(displayName(natural, 'turkish')).toBe('La4')
    expect(displayName(natural, 'western')).toBe('A4')
  })

  it('renders a positive koma offset as diyez in Turkish', () => {
    expect(displayName(sharpened, 'turkish')).toBe('Fa diyez 3 (4)')
  })

  it('renders a positive koma offset as a plus sign in Western naming', () => {
    expect(displayName(sharpened, 'western')).toBe('F+3 (4)')
  })

  it('renders a negative koma offset as bemol in Turkish', () => {
    expect(displayName(flattened, 'turkish')).toBe('Fa bemol 2 (4)')
  })

  it('renders a negative koma offset as a minus sign in Western naming', () => {
    expect(displayName(flattened, 'western')).toBe('F-2 (4)')
  })

  it('renders a chromatic label, which carries no koma offset', () => {
    const chromatic: NoteLabel = { ...natural, komaOffset: null }
    expect(displayName(chromatic, 'western')).toBe('A4')
  })
})
