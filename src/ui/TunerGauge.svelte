<script lang="ts">
  import type { DisplayState } from '../tuner/display-state'
  import {
    GAUGE_LINE_WIDTH,
    GAUGE_VIEWBOX,
    needleEndpoints,
    TICKS,
    tolerancePath,
    TRACK_PATH,
  } from './theme'

  let { state, toleranceCents }: { state: DisplayState; toleranceCents: number } = $props()

  const needle = $derived(needleEndpoints(state.centsOffset))
  const band = $derived(tolerancePath(toleranceCents))
  const reading = $derived(state.isInTune ? 'var(--accent)' : 'var(--off-tune)')
</script>

<svg
  class="gauge"
  class:dimmed={!state.hasSignal}
  viewBox="0 0 {GAUGE_VIEWBOX.width} {GAUGE_VIEWBOX.height}"
  role="img"
  aria-label="Akort göstergesi"
>
  <path
    d={TRACK_PATH}
    fill="none"
    stroke="var(--track)"
    stroke-width={GAUGE_LINE_WIDTH}
    stroke-linecap="round"
  />
  <path
    d={band}
    fill="none"
    stroke="var(--accent)"
    stroke-opacity="0.35"
    stroke-width={GAUGE_LINE_WIDTH}
    stroke-linecap="round"
  />

  {#each TICKS as tick (tick.cents)}
    <line
      x1={tick.from.x}
      y1={tick.from.y}
      x2={tick.to.x}
      y2={tick.to.y}
      stroke="var(--muted)"
      stroke-opacity={tick.isZero ? 1 : 0.55}
      stroke-width={tick.isZero ? 2 : 1.5}
      stroke-linecap="round"
    />
  {/each}

  <line
    class="needle"
    x1={needle.from.x}
    y1={needle.from.y}
    x2={needle.to.x}
    y2={needle.to.y}
    stroke={reading}
    stroke-width={state.isInTune ? 6 : 4}
    stroke-linecap="round"
  />
</svg>

<style>
  .gauge {
    display: block;
    width: 100%;
    transition: opacity 150ms ease-out;
  }

  .gauge.dimmed {
    opacity: 0.5;
  }

  /* Critically damped in the native app: the needle settles as fast as it can
     without overshooting, because overshoot reads as the note being sharp when
     it is not. A linear tween is the closest CSS equivalent. */
  .needle {
    transition: all 90ms linear;
  }

  @media (prefers-reduced-motion: reduce) {
    .needle {
      transition: none;
    }
  }
</style>
