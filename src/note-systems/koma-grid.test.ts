import { describe, expect, it } from 'vitest'
import { komaShift, nearestKomaNote, transposeKoma } from './koma-grid'
import { displayName } from './note-label'
import { frequencyForKomaStepsFromA4 } from './reference-pitch'
import { nearestChromaticNote } from './chromatic-grid'

describe('nearestKomaNote', () => {
  it('names concert A as a natural La with no koma offset', () => {
    const note = nearestKomaNote(440)
    expect(note?.turkishBaseName).toBe('La')
    expect(note?.komaOffset).toBe(0)
    expect(note?.centsOffset).toBeCloseTo(0, 6)
  })

  // Derived from the AEU 9-9-4-9-9-9-4 pattern rather than from this module:
  // Fa sits 22 komas above Do, so "Fa diyez 3" is koma 25 within the octave.
  it('names koma 25 of octave 4 as Fa diyez 3', () => {
    const do4 = frequencyForKomaStepsFromA4(-40)
    const faDiyez3 = do4 * 2 ** (25 / 53)

    const note = nearestKomaNote(faDiyez3)!

    expect(note.turkishBaseName).toBe('Fa')
    expect(note.komaOffset).toBe(3)
    expect(note.octave).toBe(4)
    expect(note.centsOffset).toBeCloseTo(0, 1)
    expect(displayName(note, 'turkish')).toBe('Fa diyez 3 (4)')
  })

  it('diverges from the chromatic grid at 450 Hz', () => {
    const chromatic = nearestChromaticNote(450)!
    const koma = nearestKomaNote(450)!

    expect(chromatic.westernBaseName).toBe('A')
    expect(chromatic.centsOffset).toBeCloseTo(38.91, 1)

    expect(koma.turkishBaseName).toBe('La')
    expect(koma.komaOffset).toBe(2)
    expect(koma.centsOffset).toBeCloseTo(-6.38, 1)
  })

  it('places the octave boundary between Si3 and Do4', () => {
    const si3 = nearestKomaNote(frequencyForKomaStepsFromA4(-44))!
    const do4 = nearestKomaNote(frequencyForKomaStepsFromA4(-40))!

    expect(si3.turkishBaseName).toBe('Si')
    expect(si3.octave).toBe(3)
    expect(si3.komaOffset).toBe(0)

    expect(do4.turkishBaseName).toBe('Do')
    expect(do4.octave).toBe(4)
    expect(do4.komaOffset).toBe(0)
  })

  it('rejects frequencies outside the usable range', () => {
    expect(nearestKomaNote(30)).toBeNull()
    expect(nearestKomaNote(5000)).toBeNull()
  })
})

describe('transposeKoma', () => {
  it('renames without touching the cents deviation', () => {
    const played = nearestKomaNote(450)!
    const transposed = transposeKoma(played, -13)
    expect(transposed.centsOffset).toBeCloseTo(played.centsOffset, 10)
  })

  it('returns the label untouched for a zero shift', () => {
    const played = nearestKomaNote(440)!
    expect(transposeKoma(played, 0)).toEqual(played)
  })
})

describe('komaShift', () => {
  // Re is index 1, Si is index 6: 49 - 9 = 40, which wraps to -13 -- the
  // 13-koma "bir bucuk ses" stated the short way round.
  it('states Re to Si as minus thirteen komas', () => {
    expect(komaShift(1, 6)).toBe(-13)
  })

  it('states Do to Re as plus nine komas', () => {
    expect(komaShift(0, 1)).toBe(9)
  })

  it('is zero when both ends name the same natural', () => {
    expect(komaShift(3, 3)).toBe(0)
  })
})
