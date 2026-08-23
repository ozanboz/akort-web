import { describe, expect, it } from 'vitest'
import { SlidingWindowBuffer } from './sliding-window-buffer'

const ramp = (length: number, start = 0) =>
  Float32Array.from({ length }, (_, index) => start + index)

describe('SlidingWindowBuffer', () => {
  it('yields nothing until a full window has arrived', () => {
    const buffer = new SlidingWindowBuffer(4)
    expect(buffer.append(ramp(3))).toEqual([])
  })

  it('yields one window when exactly enough samples arrive', () => {
    const buffer = new SlidingWindowBuffer(4)
    const windows = buffer.append(ramp(4))
    expect(windows).toHaveLength(1)
    expect(Array.from(windows[0])).toEqual([0, 1, 2, 3])
  })

  it('drains multiple windows oldest first from one oversized delivery', () => {
    const buffer = new SlidingWindowBuffer(4)
    const windows = buffer.append(ramp(12))
    expect(windows).toHaveLength(3)
    expect(Array.from(windows[0])).toEqual([0, 1, 2, 3])
    expect(Array.from(windows[2])).toEqual([8, 9, 10, 11])
  })

  it('overlaps consecutive windows when the hop is smaller than the window', () => {
    const buffer = new SlidingWindowBuffer(4, 2)
    const windows = buffer.append(ramp(8))
    expect(windows.map((window) => Array.from(window))).toEqual([
      [0, 1, 2, 3],
      [2, 3, 4, 5],
      [4, 5, 6, 7],
    ])
  })

  it('keeps leftover samples for the next delivery', () => {
    const buffer = new SlidingWindowBuffer(4)
    buffer.append(ramp(6))
    const windows = buffer.append(ramp(2, 6))
    expect(windows).toHaveLength(1)
    expect(Array.from(windows[0])).toEqual([4, 5, 6, 7])
  })

  it('discards buffered samples on reset', () => {
    const buffer = new SlidingWindowBuffer(4)
    buffer.append(ramp(3))
    buffer.reset()
    expect(buffer.append(ramp(3))).toEqual([])
  })
})
