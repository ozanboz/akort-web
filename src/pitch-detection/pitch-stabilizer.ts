// Five frames is two frames of outlier protection at roughly 165ms of history,
// short enough not to lag a real note change.
const MEDIAN_WINDOW = 5

// A semitone is 100 cents; 80 leaves room to move deliberately between adjacent
// pitches without the smoother fighting back.
const SNAP_THRESHOLD_CENTS = 80

const SMOOTHING_FACTOR = 0.35

export class PitchStabilizer {
  private recent: number[] = []
  private smoothed: number | null = null

  // A raw frame that looks like a note change but is not yet confirmed. The
  // decision cannot come from the median (one frame never moves it, so a real
  // change would lag half the window) nor from a single raw frame (that is what
  // an octave glitch looks like). Two consecutive agreeing frames separate them.
  private pendingSnap: number | null = null

  // Missed frames are not fed to the median: silence between plucks would
  // otherwise poison the window and drag the reading.
  stabilize(frequency: number | null): number | null {
    if (frequency === null || !Number.isFinite(frequency) || frequency <= 0) {
      return this.smoothed
    }

    const previous = this.smoothed
    if (previous === null) {
      this.recent = [frequency]
      this.smoothed = frequency
      this.pendingSnap = null
      return frequency
    }

    if (Math.abs(1200 * Math.log2(frequency / previous)) >= SNAP_THRESHOLD_CENTS) {
      if (
        this.pendingSnap !== null &&
        Math.abs(1200 * Math.log2(frequency / this.pendingSnap)) < SNAP_THRESHOLD_CENTS
      ) {
        this.recent = [frequency]
        this.smoothed = frequency
        this.pendingSnap = null
        return frequency
      }

      this.pendingSnap = frequency
      return previous
    }

    this.pendingSnap = null
    this.recent.push(frequency)
    if (this.recent.length > MEDIAN_WINDOW) {
      this.recent.splice(0, this.recent.length - MEDIAN_WINDOW)
    }

    // Smoothing happens in the log domain so it is even in cents rather than in
    // hertz, which would settle far more slowly at low pitches.
    const deviation = 1200 * Math.log2(median(this.recent) / previous)
    this.smoothed = previous * 2 ** ((SMOOTHING_FACTOR * deviation) / 1200)
    return this.smoothed
  }

  reset(): void {
    this.recent = []
    this.smoothed = null
    this.pendingSnap = null
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}
