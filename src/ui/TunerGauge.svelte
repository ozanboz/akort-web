<script lang="ts">
  import type { DisplayState } from '../tuner/display-state'
  import {
    GAUGE_LINE_WIDTH,
    GAUGE_VIEWBOX,
    NEEDLE,
    needleAngle,
    TICKS,
    tolerancePath,
    TRACK_PATH,
  } from './theme'

  let { state, toleranceCents }: { state: DisplayState; toleranceCents: number } = $props()

  const angle = $derived(needleAngle(state.centsOffset))
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
    x1={NEEDLE.from.x}
    y1={NEEDLE.from.y}
    x2={NEEDLE.to.x}
    y2={NEEDLE.to.y}
    stroke={reading}
    stroke-width={state.isInTune ? 6 : 4}
    stroke-linecap="round"
    style="transform: rotate({angle}deg); transform-origin: {NEEDLE.origin.x}px {NEEDLE.origin.y}px"
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

  /* Only the rotation is animated. The native gauge uses a critically damped
     spring (response 0.28, damping 1.0): it settles as fast as it can without
     overshooting, because overshoot reads as the note being sharp when it is
     not. An ease-out of the same duration is the closest CSS equivalent.
     Colour and width are deliberately left out -- crossfading them on every
     reading reads as a permanent shimmer. */
  .needle {
    transition: transform 280ms cubic-bezier(0.22, 0.9, 0.28, 1);
  }

  @media (prefers-reduced-motion: reduce) {
    .needle {
      transition: none;
    }
  }
</style>
