import { describe, expect, it } from 'vitest'
import { noteScaleFor } from './note-size'

describe('noteScaleFor', () => {
  it('leaves short chromatic labels at full size', () => {
    expect(noteScaleFor('La4')).toBe(1)
    expect(noteScaleFor('C♯4')).toBe(1)
  })

  it('leaves a Western koma label at full size', () => {
    expect(noteScaleFor('F+3 (4)')).toBe(1)
  })

  it('shrinks a Turkish koma label enough to stay on one line', () => {
    const label = 'Fa diyez 3 (4)'
    const scale = noteScaleFor(label)
    expect(scale).toBeLessThan(1)
    // Nunito semibold averages about 0.55em per glyph; a phone leaves 350px.
    expect(label.length * 0.55 * 60 * scale).toBeLessThan(350)
  })

  it('shrinks the longest label the koma grid can produce', () => {
    const label = 'Sol bemol 12 (4)'
    expect(label.length * 0.55 * 60 * noteScaleFor(label)).toBeLessThan(350)
  })

  it('never shrinks past the legibility floor', () => {
    expect(noteScaleFor('x'.repeat(80))).toBe(0.45)
  })
})
