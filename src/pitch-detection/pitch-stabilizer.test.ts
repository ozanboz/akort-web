import { describe, expect, it } from 'vitest'
import { PitchStabilizer } from './pitch-stabilizer'

const centsBetween = (a: number, b: number) => 1200 * Math.log2(a / b)

describe('PitchStabilizer', () => {
  it('passes the first reading through untouched', () => {
    const stabilizer = new PitchStabilizer()
    expect(stabilizer.stabilize(440)).toBe(440)
  })

  it('holds the last reading through a missed frame', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    expect(stabilizer.stabilize(null)).toBe(440)
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

  it('ignores non-finite and non-positive input', () => {
    const stabilizer = new PitchStabilizer()
    stabilizer.stabilize(440)
    expect(stabilizer.stabilize(0)).toBe(440)
    expect(stabilizer.stabilize(Number.NaN)).toBe(440)
  })
})
