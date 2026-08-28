import workletUrl from './capture-worklet?worker&url'
import { classifyFailure, type AudioFailure } from './errors'
import PitchWorker from './pitch-worker?worker'

// All three of these distort pitch: automatic gain compresses the signal,
// noise suppression clips harmonics, echo cancellation filters the input.
const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  autoGainControl: false,
  noiseSuppression: false,
  echoCancellation: false,
}

export class Microphone {
  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private worker: Worker | null = null
  // Refuses a concurrent start() outright. Not redundant with the counter
  // below: a second attempt would bump the generation and so supersede -- and
  // silently kill -- a first one that is still legitimately in flight, opening
  // a second device on the way.
  private active = false

  // start() suspends twice, and a teardown can land in either gap: the track
  // ends, or the component unmounts, or the user retries after a failure. The
  // counter lets a resumed attempt ask whether it still owns the object, which
  // a boolean flag cannot answer -- a retry sets the flag back to true, so the
  // stale attempt would see its own state and carry on building a second graph
  // on top of the live one. The device that graph opens is then unreachable and
  // never released.
  private generation = 0

  // Resolves true only when this call left a running graph behind. The caller
  // cannot infer that from the absence of a failure: a superseded attempt
  // reports nothing at all.
  async start(
    onFrequency: (hz: number | null) => void,
    onFailure: (failure: AudioFailure) => void,
  ): Promise<boolean> {
    if (this.active) return false
    this.active = true
    const generation = ++this.generation

    // Every failure exit tears down before reporting, so a retry starts from
    // nothing rather than on top of a half-built graph.
    const fail = (reason: AudioFailure): boolean => {
      if (generation !== this.generation) return false
      this.stop()
      onFailure(reason)
      return false
    }

    if (!globalThis.isSecureContext) return fail('insecure-context')
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === 'undefined') {
      return fail('unsupported')
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS })
    } catch (error) {
      return fail(classifyFailure(error))
    }

    // The permission prompt can sit open for as long as the user likes, so this
    // is the wider of the two gaps. The device is already open by the time we
    // find out we were superseded; close it here or nothing ever will.
    if (generation !== this.generation) {
      stream.getTracks().forEach((track) => track.stop())
      return false
    }
    this.stream = stream

    stream.getAudioTracks()[0]?.addEventListener('ended', () => fail('device-lost'))

    // Everything past this point can throw with the microphone already open:
    // addModule fetches a chunk over the network, and AudioContext construction
    // fails on browsers that ration them. Uncaught, start() rejected into a
    // click handler -- no error shown, the welcome screen still up, and the
    // microphone left running.
    try {
      this.context = new AudioContext()
      await this.context.audioWorklet.addModule(workletUrl)
      if (generation !== this.generation) return false

      this.worker = new PitchWorker()
      this.worker.postMessage({ type: 'configure', sampleRate: this.context.sampleRate })
      this.worker.onmessage = (event: MessageEvent<number | null>) => onFrequency(event.data)

      const source = this.context.createMediaStreamSource(this.stream)
      const capture = new AudioWorkletNode(this.context, 'capture-processor')
      capture.port.onmessage = (event: MessageEvent<Float32Array>) => {
        this.worker?.postMessage({ type: 'samples', samples: event.data }, [event.data.buffer])
      }
      source.connect(capture)
    } catch {
      return fail('setup-failed')
    }

    return true
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.worker?.terminate()
    void this.context?.close()
    this.stream = null
    this.worker = null
    this.context = null
    this.active = false
    // Anything still suspended inside start() is now stale.
    this.generation += 1
  }

  async suspend(): Promise<void> {
    await this.context?.suspend()
  }

  async resume(): Promise<void> {
    await this.context?.resume()
  }
}
