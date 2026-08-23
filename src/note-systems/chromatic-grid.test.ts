import { describe, expect, it } from 'vitest'
import {
  chromaticSemitoneShift,
  nearestChromaticNote,
  transposeChromatic,
} from './chromatic-grid'
import { frequencyForSemitonesFromA4 } from './reference-pitch'

describe('nearestChromaticNote', () => {
  it('names concert A as A4 with no deviation', () => {
    const note = nearestChromaticNote(440)
    expect(note?.westernBaseName).toBe('A')
    expect(note?.turkishBaseName).toBe('La')
    expect(note?.octave).toBe(4)
    expect(note?.centsOffset).toBeCloseTo(0, 6)
    expect(note?.komaOffset).toBeNull()
    expect(note?.scalePosition).toBe(9)
  })

  it('reports 450 Hz as A4 sharp by 38.91 cents', () => {
    const note = nearestChromaticNote(450)
    expect(note?.westernBaseName).toBe('A')
    expect(note?.centsOffset).toBeCloseTo(38.91, 1)
  })

  it('increments the octave at C, not at A', () => {
    const c4 = frequencyForSemitonesFromA4(-9)
    const b3 = frequencyForSemitonesFromA4(-10)
    expect(nearestChromaticNote(c4)?.octave).toBe(4)
    expect(nearestChromaticNote(c4)?.westernBaseName).toBe('C')
    expect(nearestChromaticNote(b3)?.octave).toBe(3)
    expect(nearestChromaticNote(b3)?.westernBaseName).toBe('B')
  })

  it('uses the sharp sign glyph rather than the ASCII number sign', () => {
    const cSharp4 = frequencyForSemitonesFromA4(-8)
    expect(nearestChromaticNote(cSharp4)?.westernBaseName).toBe('C♯')
  })

  it('rejects frequencies outside the usable range', () => {
    expect(nearestChromaticNote(30)).toBeNull()
    expect(nearestChromaticNote(5000)).toBeNull()
  })

  it('follows a non-standard reference pitch', () => {
    const note = nearestChromaticNote(442, 442)
    expect(note?.westernBaseName).toBe('A')
    expect(note?.centsOffset).toBeCloseTo(0, 6)
  })
})

describe('transposeChromatic', () => {
  it('renames without touching the cents deviation', () => {
    const played = nearestChromaticNote(450)!
    const transposed = transposeChromatic(played, 2)
    expect(transposed.westernBaseName).toBe('B')
    expect(transposed.centsOffset).toBeCloseTo(played.centsOffset, 10)
  })

  it('returns the label untouched for a zero shift', () => {
    const played = nearestChromaticNote(440)!
    expect(transposeChromatic(played, 0)).toEqual(played)
  })

  it('carries the octave across the C boundary', () => {
    const b4 = nearestChromaticNote(frequencyForSemitonesFromA4(2))!
    const transposed = transposeChromatic(b4, 1)
    expect(transposed.westernBaseName).toBe('C')
    expect(transposed.octave).toBe(5)
  })
})

describe('chromaticSemitoneShift', () => {
  it('takes the nearer direction rather than the long way round', () => {
    expect(chromaticSemitoneShift(9, 6)).toBe(-3)
    expect(chromaticSemitoneShift(0, 11)).toBe(-1)
    expect(chromaticSemitoneShift(11, 0)).toBe(1)
  })

  it('is zero when both ends name the same degree', () => {
    expect(chromaticSemitoneShift(4, 4)).toBe(0)
  })
})
