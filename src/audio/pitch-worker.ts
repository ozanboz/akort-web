import { hopSizeFor, windowSizeFor } from '../pitch-detection/analysis-rate'
import { PitchStabilizer } from '../pitch-detection/pitch-stabilizer'
import { SlidingWindowBuffer } from '../pitch-detection/sliding-window-buffer'
import { estimateFrequency } from '../pitch-detection/yin'

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
let buffer = new SlidingWindowBuffer(windowSizeFor(sampleRate), hopSizeFor(sampleRate))
const stabilizer = new PitchStabilizer()

self.onmessage = (event: MessageEvent<Incoming>) => {
  const message = event.data

  if (message.type === 'configure') {
    sampleRate = message.sampleRate
    buffer = new SlidingWindowBuffer(windowSizeFor(sampleRate), hopSizeFor(sampleRate))
    stabilizer.reset()
    return
  }

  for (const window of buffer.append(message.samples)) {
    const raw = estimateFrequency(window, { sampleRate })
    self.postMessage(stabilizer.stabilize(raw))
  }
}
