<script lang="ts">
  import type { DisplayState } from '../tuner/display-state'

  let { state }: { state: DisplayState } = $props()

  const cents = $derived(
    state.hasSignal ? `${state.centsOffset >= 0 ? '+' : ''}${state.centsOffset.toFixed(1)} ¢` : '',
  )
</script>

<div class="display" class:dimmed={!state.hasSignal}>
  <p class="note" aria-live="polite">{state.label}</p>
  <p class="cents">{cents}</p>
</div>

<style>
  .display { text-align: center; }
  .display.dimmed { opacity: 0.45; }
  .note { font-size: 3rem; font-weight: 600; margin: 0; }
  .cents { font-variant-numeric: tabular-nums; margin: 0.25rem 0 0; opacity: 0.7; }
</style>
