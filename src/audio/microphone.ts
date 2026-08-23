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

  async start(
    onFrequency: (hz: number | null) => void,
    onFailure: (failure: AudioFailure) => void,
  ): Promise<void> {
    if (!globalThis.isSecureContext) {
      onFailure('insecure-context')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === 'undefined') {
      onFailure('unsupported')
      return
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS })
    } catch (error) {
      onFailure(classifyFailure(error))
      return
    }

    this.stream.getAudioTracks()[0]?.addEventListener('ended', () => {
      this.stop()
      onFailure('device-lost')
    })

    this.context = new AudioContext()
    await this.context.audioWorklet.addModule(workletUrl)

    this.worker = new PitchWorker()
    this.worker.postMessage({ type: 'configure', sampleRate: this.context.sampleRate })
    this.worker.onmessage = (event: MessageEvent<number | null>) => onFrequency(event.data)

    const source = this.context.createMediaStreamSource(this.stream)
    const capture = new AudioWorkletNode(this.context, 'capture-processor')
    capture.port.onmessage = (event: MessageEvent<Float32Array>) => {
      this.worker?.postMessage({ type: 'samples', samples: event.data }, [event.data.buffer])
    }
    source.connect(capture)
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.worker?.terminate()
    void this.context?.close()
    this.stream = null
    this.worker = null
    this.context = null
  }

  async suspend(): Promise<void> {
    await this.context?.suspend()
  }

  async resume(): Promise<void> {
    await this.context?.resume()
  }
}
