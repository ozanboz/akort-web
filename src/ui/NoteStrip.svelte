<script lang="ts">
  import {
    chromaticAlphabet,
    isAccidental,
    naturalAlphabet,
  } from '../note-systems/note-alphabet'
  import type { Settings } from '../settings/settings-store'
  import type { DisplayState } from '../tuner/display-state'

  let { state, settings }: { state: DisplayState; settings: Settings } = $props()

  const names = $derived(
    settings.tuningMode === 'koma'
      ? naturalAlphabet(settings.noteNaming)
      : chromaticAlphabet(settings.noteNaming),
  )
</script>

<ol class="strip">
  {#each names as name, index (name)}
    <li
      class="cell"
      class:active={state.hasSignal && state.scalePosition === index}
      class:accidental={settings.tuningMode === 'chromatic' && isAccidental(index)}
    >
      <span class="name">{name}</span>
      {#if state.scalePosition === index && state.komaOffset !== null && state.komaOffset !== 0}
        <span class="badge">{state.komaOffset > 0 ? '+' : '−'}{Math.abs(state.komaOffset)}</span>
      {/if}
    </li>
  {/each}
</ol>

<style>
  .strip {
    display: flex;
    gap: 0.25rem;
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    max-width: 26rem;
  }
  .cell {
    flex: 1;
    text-align: center;
    padding: 0.35rem 0;
    border-radius: 0.35rem;
    font-size: 0.9rem;
    opacity: 0.55;
  }
  .cell.accidental { opacity: 0.35; }
  .cell.active { opacity: 1; background: currentColor; color: canvas; font-weight: 600; }
  .badge { display: block; font-size: 0.7rem; }
</style>
