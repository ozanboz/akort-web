export function octaveAndRemainder(
  index: number,
  unitsPerOctave: number,
): { octave: number; remainder: number } {
  const octave = Math.floor(index / unitsPerOctave)
  const remainder = ((index % unitsPerOctave) + unitsPerOctave) % unitsPerOctave
  return { octave, remainder }
}
