<script lang="ts">
  import type { DisplayState } from '../tuner/display-state'
  import { noteScaleFor } from './note-size'
  import { isOffScale } from './theme'

  let { state }: { state: DisplayState } = $props()

  const sharp = $derived(state.centsOffset > 0)
  const offScale = $derived(isOffScale(state.centsOffset))
  const cents = $derived(
    state.hasSignal
      ? `${state.centsOffset >= 0 ? '+' : '−'}${Math.abs(state.centsOffset).toFixed(1)} ¢`
      : '—',
  )
  const tone = $derived(
    !state.hasSignal ? 'var(--muted)' : state.isInTune ? 'var(--accent)' : 'var(--off-tune)',
  )
  const noteTone = $derived(
    !state.hasSignal ? 'var(--faint)' : state.isInTune ? 'var(--accent)' : 'var(--ink)',
  )
  const noteScale = $derived(noteScaleFor(state.label))
</script>

<div class="readout" class:dimmed={!state.hasSignal}>
  <div class="status" style="color: {tone}">
    {#if !state.hasSignal}
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2.6 12h2.6l2-5 3 10 3-13 3 16 2-8h3.2"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {:else if state.isInTune}
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="currentColor" />
        <path
          d="M6.4 10.2 L8.9 12.6 L13.6 7.6"
          stroke="var(--surface)"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {:else}
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        {#if offScale}
          <path
            d={sharp ? 'M6.4 4.6 L11.8 10 L6.4 15.4' : 'M13.6 4.6 L8.2 10 L13.6 15.4'}
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d={sharp ? 'M11.4 4.6 L16.8 10 L11.4 15.4' : 'M8.6 4.6 L3.2 10 L8.6 15.4'}
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        {:else}
          <path
            d={sharp ? 'M7.6 4.6 L13 10 L7.6 15.4' : 'M12.4 4.6 L7 10 L12.4 15.4'}
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        {/if}
      </svg>
    {/if}
    <span class="numeric">{cents}</span>
  </div>

  <p
    class="note numeric"
    style="color: {noteTone}; font-size: calc(var(--note-size) * {noteScale})"
    aria-live="polite"
  >
    {state.label}
  </p>
</div>

<style>
  .readout {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap);
    transition: opacity 150ms ease-out;
  }

  .readout.dimmed {
    opacity: 0.5;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    font-weight: 600;
  }

  .status svg {
    width: 17px;
    height: 17px;
  }

  .note {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--note-size);
    margin: 0;
    font-weight: 600;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
  }
</style>
