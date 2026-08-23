export type NoteNaming = 'turkish' | 'western'

export interface NoteLabel {
  turkishBaseName: string
  westernBaseName: string
  octave: number
  komaOffset: number | null
  centsOffset: number
  scalePosition: number
}

export function displayName(label: NoteLabel, naming: NoteNaming): string {
  const base = naming === 'turkish' ? label.turkishBaseName : label.westernBaseName
  const { komaOffset, octave } = label

  if (komaOffset === null || komaOffset === 0) {
    return `${base}${octave}`
  }

  const magnitude = Math.abs(komaOffset)

  // The octave is parenthesised on accidental notes so it cannot be misread as
  // extra koma digits: "F+3" followed directly by "4" reads as "+34".
  if (naming === 'turkish') {
    const direction = komaOffset > 0 ? 'diyez' : 'bemol'
    return `${base} ${direction} ${magnitude} (${octave})`
  }

  const sign = komaOffset > 0 ? '+' : '-'
  return `${base}${sign}${magnitude} (${octave})`
}
