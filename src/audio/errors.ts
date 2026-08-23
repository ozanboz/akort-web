export type AudioFailure =
  | 'permission-denied'
  | 'no-microphone'
  | 'device-busy'
  | 'insecure-context'
  | 'unsupported'
  | 'device-lost'

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
