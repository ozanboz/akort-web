<script lang="ts">
  import type { DisplayState } from '../tuner/display-state'
  import { GAUGE_MAX_CENTS, needleAngle } from './theme'

  let { state, toleranceCents }: { state: DisplayState; toleranceCents: number } = $props()

  const angle = $derived(needleAngle(state.centsOffset))
  const toleranceHalfWidth = $derived((toleranceCents / GAUGE_MAX_CENTS) * 50)
</script>

<svg class="gauge" class:dimmed={!state.hasSignal} viewBox="0 0 200 110" role="img"
     aria-label="Akort göstergesi">
  <path d="M 10 100 A 90 90 0 0 1 190 100" class="arc" />
  <rect
    x={100 - toleranceHalfWidth}
    y="6"
    width={toleranceHalfWidth * 2}
    height="12"
    class="tolerance"
    class:in-tune={state.isInTune}
  />
  <line x1="100" y1="100" x2="100" y2="18" class="needle"
        style="transform: rotate({angle}deg)" />
  <circle cx="100" cy="100" r="5" class="pivot" />
</svg>

<style>
  .gauge { width: 100%; max-width: 26rem; }
  .gauge.dimmed { opacity: 0.35; }
  .arc { fill: none; stroke: currentColor; stroke-width: 2; opacity: 0.25; }
  .tolerance { fill: currentColor; opacity: 0.2; }
  .tolerance.in-tune { opacity: 0.6; }
  .needle {
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    transform-origin: 100px 100px;
    transition: transform 90ms linear;
  }
  .pivot { fill: currentColor; }
</style>
