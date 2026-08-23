import { PitchStabilizer } from '../pitch-detection/pitch-stabilizer'
import { SlidingWindowBuffer } from '../pitch-detection/sliding-window-buffer'
import { estimateFrequency } from '../pitch-detection/yin'

const WINDOW_SIZE = 2048

// A hop of a third of the window re-estimates roughly every 15ms at 44.1kHz,
// giving about 65 updates per second before stabilisation.
const HOP_SIZE = 683

interface ConfigureMessage {
  type: 'configure'
  sampleRate: number
}

interface SamplesMessage {
  type: 'samples'
  samples: Float32Array
}

type Incoming = ConfigureMessage | SamplesMessage

let sampleRate = 44100
let buffer = new SlidingWindowBuffer(WINDOW_SIZE, HOP_SIZE)
const stabilizer = new PitchStabilizer()

self.onmessage = (event: MessageEvent<Incoming>) => {
  const message = event.data

  if (message.type === 'configure') {
    sampleRate = message.sampleRate
    buffer = new SlidingWindowBuffer(WINDOW_SIZE, HOP_SIZE)
    stabilizer.reset()
    return
  }

  for (const window of buffer.append(message.samples)) {
    const raw = estimateFrequency(window, { sampleRate })
    self.postMessage(stabilizer.stabilize(raw))
  }
}
