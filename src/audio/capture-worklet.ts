// The worklet only copies samples out. YIN costs roughly 930k operations per
// frame and a render quantum must finish inside ~2.9ms, so the analysis runs in
// a Worker instead; doing it here would break up the audio.
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][]): boolean {
    const channel = inputs[0]?.[0]
    if (channel && channel.length > 0) {
      this.port.postMessage(channel.slice(0))
    }
    return true
  }
}

registerProcessor('capture-processor', CaptureProcessor)
