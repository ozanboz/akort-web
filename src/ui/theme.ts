export const GAUGE_MAX_CENTS = 50
export const GAUGE_SWEEP_DEGREES = 90

// Geometry lifted from the iOS gauge so both readouts agree pixel for pixel.
// The viewBox is a 2:1 box whose bottom edge passes through the pivot, so the
// arc meets it with nothing left over.
export const GAUGE_VIEWBOX = { width: 320, height: 172 }
const PIVOT = { x: 160, y: 160 }
const RADIUS = 150
export const GAUGE_LINE_WIDTH = 10

// The needle runs from just outside the pivot to just inside the arc, so it
// reads as an instrument hand rather than a bar crossing the dial.
const NEEDLE_INNER_RADIUS = RADIUS * 0.1
const NEEDLE_OUTER_RADIUS = RADIUS - GAUGE_LINE_WIDTH * 1.6

export interface Point {
  x: number
  y: number
}

function pointAt(degrees: number, radius: number): Point {
  const radians = (degrees * Math.PI) / 180
  return {
    x: PIVOT.x + radius * Math.sin(radians),
    y: PIVOT.y - radius * Math.cos(radians),
  }
}

function degreesForCents(cents: number): number {
  const clamped = Math.min(Math.max(cents, -GAUGE_MAX_CENTS), GAUGE_MAX_CENTS)
  return (clamped / GAUGE_MAX_CENTS) * GAUGE_SWEEP_DEGREES
}

function arcPath(halfSweepDegrees: number): string {
  const start = pointAt(-halfSweepDegrees, RADIUS)
  const end = pointAt(halfSweepDegrees, RADIUS)
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`
}

export const TRACK_PATH = arcPath(GAUGE_SWEEP_DEGREES)

export function tolerancePath(toleranceCents: number): string {
  return arcPath(degreesForCents(toleranceCents))
}

export function needleEndpoints(cents: number): { from: Point; to: Point } {
  const degrees = degreesForCents(cents)
  return {
    from: pointAt(degrees, NEEDLE_INNER_RADIUS),
    to: pointAt(degrees, NEEDLE_OUTER_RADIUS),
  }
}

// Zero and the quarter marks only. Ticks at the range ends would sit on the
// arc's rounded caps and read as smudges rather than marks.
export const TICKS = [-GAUGE_MAX_CENTS / 2, 0, GAUGE_MAX_CENTS / 2].map((cents) => {
  const isZero = cents === 0
  const length = isZero ? 14 : 9
  const centre = RADIUS - GAUGE_LINE_WIDTH - (isZero ? 9 : 6)
  const degrees = degreesForCents(cents)
  return {
    cents,
    isZero,
    from: pointAt(degrees, centre - length / 2),
    to: pointAt(degrees, centre + length / 2),
  }
})

export function isOffScale(cents: number): boolean {
  return Math.abs(cents) > GAUGE_MAX_CENTS
}
