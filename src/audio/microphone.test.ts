import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AudioFailure } from './errors'
import { Microphone } from './microphone'

// Vite-specific specifiers that environment: 'node' cannot resolve. Neither
// takes part in the ownership rules under test.
let workersCreated: number
vi.mock('./pitch-worker?worker', () => ({
  default: class {
    constructor() {
      workersCreated += 1
    }
    postMessage() {}
    terminate() {}
  },
}))
vi.mock('./capture-worklet?worker&url', () => ({ default: 'capture-worklet.js' }))

interface FakeTrack {
  stopped: number
  listeners: (() => void)[]
}

interface FakeStream {
  track: FakeTrack
  getTracks(): { stop(): void }[]
  getAudioTracks(): { addEventListener(event: string, handler: () => void): void }[]
}

function fakeStream(): FakeStream {
  const track: FakeTrack = { stopped: 0, listeners: [] }
  return {
    track,
    getTracks: () => [{ stop: () => (track.stopped += 1) }],
    getAudioTracks: () => [
      { addEventListener: (_event, handler) => track.listeners.push(handler) },
    ],
  }
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

// Promise.withResolvers is ES2024 and tsconfig.app.json typechecks against
// es2023, so the executor form is required here.
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((settle, fail) => {
    resolve = settle
    reject = fail
  })
  return { promise, resolve, reject }
}

// Both suspension points hand back a deferred, so a test decides when -- and in
// what order -- each attempt resumes. That ordering is the whole subject here.
let userMedia: Deferred<FakeStream>[]
let addModule: Deferred<void>[]
let closedContexts: number

beforeEach(() => {
  userMedia = []
  addModule = []
  closedContexts = 0
  workersCreated = 0

  vi.stubGlobal('isSecureContext', true)
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: () => {
        const pending = deferred<FakeStream>()
        userMedia.push(pending)
        return pending.promise
      },
    },
  })
  vi.stubGlobal(
    'AudioContext',
    class {
      sampleRate = 48000
      audioWorklet = {
        addModule: () => {
          const pending = deferred<void>()
          addModule.push(pending)
          return pending.promise
        },
      }
      createMediaStreamSource() {
        return { connect: () => {} }
      }
      close() {
        closedContexts += 1
      }
    },
  )
  vi.stubGlobal(
    'AudioWorkletNode',
    class {
      port: { onmessage: unknown } = { onmessage: null }
    },
  )
})

const noop = () => {}

describe('Microphone ownership', () => {
  it('refuses a concurrent start without opening a second device', async () => {
    const microphone = new Microphone()
    const first = microphone.start(noop, noop)

    expect(await microphone.start(noop, noop)).toBe(false)
    expect(userMedia).toHaveLength(1)

    userMedia[0].resolve(fakeStream())
    await userMedia[0].promise
    addModule[0].resolve()
    expect(await first).toBe(true)
  })

  it('closes a stream that arrives after the attempt was torn down', async () => {
    const microphone = new Microphone()
    const failures: AudioFailure[] = []
    const attempt = microphone.start(noop, (reason) => failures.push(reason))

    microphone.stop()
    const stream = fakeStream()
    userMedia[0].resolve(stream)

    expect(await attempt).toBe(false)
    expect(stream.track.stopped).toBe(1)
    // A superseded attempt reports nothing; its failure is not the live state.
    expect(failures).toEqual([])
  })

  it('lets a retry win when the device is lost during the worklet fetch', async () => {
    const microphone = new Microphone()
    const failures: AudioFailure[] = []
    const report = (reason: AudioFailure) => failures.push(reason)

    const first = microphone.start(noop, report)
    const firstStream = fakeStream()
    userMedia[0].resolve(firstStream)
    await userMedia[0].promise
    expect(addModule).toHaveLength(1)

    // Unplugged while the chunk is still fetching.
    firstStream.track.listeners.forEach((fire) => fire())
    expect(failures).toEqual(['device-lost'])

    const second = microphone.start(noop, report)
    userMedia[1].resolve(fakeStream())
    await userMedia[1].promise
    addModule[1].resolve()
    expect(await second).toBe(true)

    // The abandoned first attempt only now resumes -- and successfully, which
    // is the case that the generation check after the await exists for. On the
    // reject path fail()'s own check already covers it; here there is no throw
    // to catch, so without the check the stale attempt walks on and overwrites
    // this.worker, orphaning the worker the live graph is reading from.
    addModule[0].resolve()
    expect(await first).toBe(false)
    expect(workersCreated).toBe(1)
    // It must not report over the retry, nor tear the live graph down.
    expect(failures).toEqual(['device-lost'])
    expect(closedContexts).toBe(1)
  })

  it('ignores an ended event from a stream that has been replaced', async () => {
    const microphone = new Microphone()
    const failures: AudioFailure[] = []
    const report = (reason: AudioFailure) => failures.push(reason)

    const first = microphone.start(noop, report)
    const firstStream = fakeStream()
    userMedia[0].resolve(firstStream)
    await userMedia[0].promise
    addModule[0].resolve()
    await first

    microphone.stop()
    const second = microphone.start(noop, report)
    userMedia[1].resolve(fakeStream())
    await userMedia[1].promise
    addModule[1].resolve()
    expect(await second).toBe(true)

    firstStream.track.listeners.forEach((fire) => fire())
    expect(failures).toEqual([])
  })

  it('reports a setup failure, frees the device and stays retryable', async () => {
    const microphone = new Microphone()
    const failures: AudioFailure[] = []
    const attempt = microphone.start(noop, (reason) => failures.push(reason))
    const stream = fakeStream()
    userMedia[0].resolve(stream)
    await userMedia[0].promise
    addModule[0].reject(new Error('chunk 404'))

    expect(await attempt).toBe(false)
    expect(failures).toEqual(['setup-failed'])
    expect(stream.track.stopped).toBe(1)

    // Not wedged: the guard has been released.
    const retry = microphone.start(noop, noop)
    expect(userMedia).toHaveLength(2)
    userMedia[1].resolve(fakeStream())
    await userMedia[1].promise
    addModule[1].resolve()
    expect(await retry).toBe(true)
  })
})
