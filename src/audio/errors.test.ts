import { describe, expect, it } from 'vitest'
import { classifyFailure } from './errors'

const domError = (name: string) => Object.assign(new Error(name), { name })

describe('classifyFailure', () => {
  it('maps a denied permission', () => {
    expect(classifyFailure(domError('NotAllowedError'))).toBe('permission-denied')
    expect(classifyFailure(domError('SecurityError'))).toBe('permission-denied')
  })

  it('maps a missing device', () => {
    expect(classifyFailure(domError('NotFoundError'))).toBe('no-microphone')
    expect(classifyFailure(domError('OverconstrainedError'))).toBe('no-microphone')
  })

  it('maps a device already in use', () => {
    expect(classifyFailure(domError('NotReadableError'))).toBe('device-busy')
    expect(classifyFailure(domError('AbortError'))).toBe('device-busy')
  })

  it('falls back to unsupported for anything unrecognised', () => {
    expect(classifyFailure(new Error('boom'))).toBe('unsupported')
    expect(classifyFailure(null)).toBe('unsupported')
  })
})
