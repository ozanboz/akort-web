import { describe, expect, it } from 'vitest'
import { estimateFrequency } from './yin'

const SAMPLE_RATE = 44100
const WINDOW_SIZE = 2048
const FRAME_BUDGET_MS = 33

describe('YIN performance', () => {
  it('estimates a window well inside the frame budget', () => {
    const samples = Float32Array.from({ length: WINDOW_SIZE }, (_, index) =>
      Math.sin((2 * Math.PI * 220 * index) / SAMPLE_RATE),
    )

    const iterations = 20
    const started = performance.now()
    for (let run = 0; run < iterations; run += 1) {
      estimateFrequency(samples, { sampleRate: SAMPLE_RATE })
    }
    const perCall = (performance.now() - started) / iterations

    console.log(`YIN per call: ${perCall.toFixed(3)} ms (budget ${FRAME_BUDGET_MS} ms)`)
    expect(perCall).toBeLessThan(FRAME_BUDGET_MS)
  })
})
