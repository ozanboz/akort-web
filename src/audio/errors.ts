export type AudioFailure =
  | 'permission-denied'
  | 'no-microphone'
  | 'device-busy'
  | 'insecure-context'
  | 'unsupported'
  | 'device-lost'
  // Permission was granted and the device opened, but building the audio graph
  // failed -- a worklet chunk that would not load, or a refused AudioContext.
  // Distinct from 'unsupported' because retrying can genuinely succeed.
  | 'setup-failed'

export function classifyFailure(error: unknown): AudioFailure {
  const name = error instanceof Error ? error.name : ''

  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'permission-denied'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'no-microphone'
    case 'NotReadableError':
    case 'AbortError':
      return 'device-busy'
    default:
      return 'unsupported'
  }
}
