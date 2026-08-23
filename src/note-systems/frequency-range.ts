export const DEFAULT_MIN_FREQUENCY = 65
export const DEFAULT_MAX_FREQUENCY = 2000

export function containsFrequency(
  frequency: number,
  min: number = DEFAULT_MIN_FREQUENCY,
  max: number = DEFAULT_MAX_FREQUENCY,
): boolean {
  return frequency > 0 && frequency >= min && frequency <= max
}
