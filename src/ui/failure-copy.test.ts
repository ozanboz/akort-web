import { describe, expect, it } from 'vitest'
import type { AudioFailure } from '../audio/errors'
import { failureCopy } from './failure-copy'

const ALL: AudioFailure[] = [
  'permission-denied',
  'no-microphone',
  'device-busy',
  'insecure-context',
  'unsupported',
  'device-lost',
]

describe('failureCopy', () => {
  it('covers every failure with non-empty copy', () => {
    for (const failure of ALL) {
      const copy = failureCopy(failure)
      expect(copy.title.length).toBeGreaterThan(0)
      expect(copy.body.length).toBeGreaterThan(0)
    }
  })

  it('offers a retry where retrying can succeed', () => {
    expect(failureCopy('permission-denied').canRetry).toBe(true)
    expect(failureCopy('device-busy').canRetry).toBe(true)
    expect(failureCopy('device-lost').canRetry).toBe(true)
  })

  it('does not offer a retry where retrying cannot help', () => {
    expect(failureCopy('no-microphone').canRetry).toBe(false)
    expect(failureCopy('unsupported').canRetry).toBe(false)
    expect(failureCopy('insecure-context').canRetry).toBe(false)
  })
})
