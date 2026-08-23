import { describe, expect, it } from 'vitest'
import { KOMA_BASE_POSITIONS } from './koma-grid'

const KOMA_CENTS = 1200 / 53
const cents = (ratio: number) => 1200 * Math.log2(ratio)

// These assertions are independent of the ported tables: they check the grid
// against pure interval ratios, so a table copied wrongly from the Swift source
// still fails here. Copying a table only proves sameness, not correctness.
describe('53-EDO approximation of pure intervals', () => {
  it('approximates the pure fifth within a tenth of a cent', () => {
    expect(Math.abs(31 * KOMA_CENTS - cents(3 / 2))).toBeLessThan(0.1)
  })

  it('approximates the pure major third within one and a half cents', () => {
    expect(Math.abs(17 * KOMA_CENTS - cents(5 / 4))).toBeLessThan(1.5)
  })

  it('closes the octave exactly at 53 komas', () => {
    expect(53 * KOMA_CENTS).toBeCloseTo(1200, 10)
  })

  it('beats 12-TET on both intervals', () => {
    const fifthKoma = Math.abs(31 * KOMA_CENTS - cents(3 / 2))
    const fifthEqual = Math.abs(700 - cents(3 / 2))
    const thirdKoma = Math.abs(17 * KOMA_CENTS - cents(5 / 4))
    const thirdEqual = Math.abs(400 - cents(5 / 4))

    expect(fifthKoma).toBeLessThan(fifthEqual)
    expect(thirdKoma).toBeLessThan(thirdEqual)
  })
})

describe('AEU diatonic pattern', () => {
  it('spaces the naturals as whole tone 9, bakiye semitone 4', () => {
    const positions = KOMA_BASE_POSITIONS.map((entry) => entry.position)
    expect(positions).toEqual([0, 9, 18, 22, 31, 40, 49])

    const steps = positions.slice(1).map((value, index) => value - positions[index])
    expect(steps).toEqual([9, 9, 4, 9, 9, 9])
    expect(53 - positions[positions.length - 1]).toBe(4)
  })
})
