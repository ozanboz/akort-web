import { describe, expect, it } from 'vitest'
import { PitchStabilizer } from './pitch-stabilizer'

const centsBetween = (a: number, b: number) => 1200 * Math.log2(a / b)

describe('PitchStabilizer', () => {
  it('passes the first reading through untouched', () => {
    const stabilizer = new PitchStabilizer()
    expect(stabilizer.stabilize(440)).toBe(440)
  })

  // Holding the last reading here instead would hide the dropout from
  // deriveDisplayState, whose miss counter is what dims the readout.
  it('reports a missed frame as a miss', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    expect(stabilizer.stabilize(null)).toBeNull()
  })

  // Inside the snap threshold on purpose: 880 would take the snap branch and
  // return the previous reading without ever touching the median or the
  // smoother, which would pin nothing about resuming. 441.74 is 440 smoothed
  // toward a median of 445 -- clearing the median window on a miss would give
  // 443.47, and clearing the smoothed value would give 450.
  it('resumes from the pre-gap pitch rather than re-seeding', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    for (let frame = 0; frame < 20; frame += 1) stabilizer.stabilize(null)
    expect(stabilizer.stabilize(450)).toBeCloseTo(441.74, 1)
  })

  // A note change begins in the decay of the old note, which is where YIN
  // misses, so the two confirming frames are often not adjacent. Clearing the
  // snap candidate on a miss delays this by a frame -- and with misses landing
  // every other frame it never confirms at all, leaving the readout undimmed
  // on the old note while the new one sounds.
  it('confirms a note change whose frames are split by a miss', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    expect(stabilizer.stabilize(330)).toBe(440)
    expect(stabilizer.stabilize(null)).toBeNull()
    expect(stabilizer.stabilize(330)).toBe(330)
  })

  it('still converges on a note change with misses interleaved throughout', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    const readings = [330, null, 330, null, 330].map((frame) => stabilizer.stabilize(frame))
    expect(readings.at(-1)).toBeCloseTo(330, 0)
  })

  it('returns null before any reading has arrived', () => {
    expect(new PitchStabilizer().stabilize(null)).toBeNull()
  })

  it('rejects a single-frame octave glitch', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    expect(stabilizer.stabilize(880)).toBe(440)
  })

  it('snaps after two consecutive frames agree on the new pitch', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    stabilizer.stabilize(880)
    expect(stabilizer.stabilize(880)).toBe(880)
  })

  it('damps a small wobble instead of following it', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    const smoothed = stabilizer.stabilize(442)!
    expect(smoothed).toBeGreaterThan(440)
    expect(smoothed).toBeLessThan(442)
  })

  it('converges toward a sustained new value within a few frames', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    let latest = 440
    for (let frame = 0; frame < 12; frame += 1) latest = stabilizer.stabilize(442)!
    expect(Math.abs(centsBetween(latest, 442))).toBeLessThan(2)
  })

  it('forgets all history on reset', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    stabilizer.reset()
    expect(stabilizer.stabilize(null)).toBeNull()
  })

  it('reports non-finite and non-positive input as a miss', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    expect(stabilizer.stabilize(0)).toBeNull()
    expect(stabilizer.stabilize(Number.NaN)).toBeNull()
  })
})
