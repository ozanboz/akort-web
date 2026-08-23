export const GAUGE_SWEEP_DEGREES = 180
export const GAUGE_MAX_CENTS = 50

export function needleAngle(centsOffset: number): number {
  const clamped = Math.min(Math.max(centsOffset, -GAUGE_MAX_CENTS), GAUGE_MAX_CENTS)
  return (clamped / GAUGE_MAX_CENTS) * (GAUGE_SWEEP_DEGREES / 2)
}
