// A hop smaller than the window overlaps consecutive analyses, raising the
// update rate without shrinking the window YIN needs for accuracy.
export class SlidingWindowBuffer {
  readonly windowSize: number
  readonly hopSize: number
  private buffer: number[] = []

  constructor(windowSize: number, hopSize?: number) {
    this.windowSize = windowSize
    this.hopSize = Math.max(1, hopSize ?? windowSize)
  }

  append(samples: Float32Array): Float32Array[] {
    for (const sample of samples) this.buffer.push(sample)

    const windows: Float32Array[] = []
    while (this.buffer.length >= this.windowSize) {
      windows.push(Float32Array.from(this.buffer.slice(0, this.windowSize)))
      this.buffer.splice(0, this.hopSize)
    }
    return windows
  }

  reset(): void {
    this.buffer = []
  }
}
