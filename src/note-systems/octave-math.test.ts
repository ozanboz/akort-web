import { describe, expect, it } from 'vitest'
import { octaveAndRemainder } from './octave-math'

describe('octaveAndRemainder', () => {
  it('splits a positive index into octave and remainder', () => {
    expect(octaveAndRemainder(14, 12)).toEqual({ octave: 1, remainder: 2 })
  })

  it('floors toward negative infinity so remainders stay positive', () => {
    expect(octaveAndRemainder(-1, 12)).toEqual({ octave: -1, remainder: 11 })
  })

  it('handles the 53-koma octave', () => {
    expect(octaveAndRemainder(212, 53)).toEqual({ octave: 4, remainder: 0 })
  })
})
