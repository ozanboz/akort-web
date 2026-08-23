<script lang="ts">
  import { chromaticAlphabet, isAccidental, naturalAlphabet } from '../note-systems/note-alphabet'
  import type { Settings } from '../settings/settings-store'
  import type { DisplayState } from '../tuner/display-state'

  let { state, settings }: { state: DisplayState; settings: Settings } = $props()

  const names = $derived(
    settings.tuningMode === 'koma'
      ? naturalAlphabet(settings.noteNaming)
      : chromaticAlphabet(settings.noteNaming),
  )
  const tone = $derived(state.isInTune ? 'var(--accent)' : 'var(--off-tune)')
  const wash = $derived(
    state.isInTune ? 'rgba(30, 143, 130, 0.16)' : 'rgba(224, 132, 44, 0.16)',
  )

  function badge(index: number): string {
    if (!state.hasSignal || state.scalePosition !== index) return ''
    if (state.komaOffset === null || state.komaOffset === 0) return ''
    return state.komaOffset > 0 ? `+${state.komaOffset}` : `−${Math.abs(state.komaOffset)}`
  }
</script>

<ol class="strip" class:dense={names.length > 7}>
  {#each names as name, index (name)}
    {@const active = state.hasSignal && state.scalePosition === index}
    <li
      class="cell"
      class:accidental={settings.tuningMode === 'chromatic' && isAccidental(index)}
      style={active ? `background: ${wash}; color: ${tone}` : ''}
    >
      <span class="name" class:strong={active}>{name}</span>
      <!-- The badge line is reserved on every cell so lighting a note that
           carries a koma offset cannot nudge the strip's baseline. -->
      <span class="badge" style:visibility={badge(index) ? 'visible' : 'hidden'}>
        {badge(index) || '+0'}
      </span>
    </li>
  {/each}
</ol>

<style>
  .strip {
    display: flex;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
    width: 100%;
  }

  .cell {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 5px 0;
    border-radius: 6px;
    color: var(--muted);
  }

  .cell.accidental {
    opacity: 0.45;
  }

  .name {
    font-size: 15px;
    white-space: nowrap;
  }

  /* Twelve chromatic cells across a phone leave about 30px each, and "Sol♯"
     does not fit at the natural size. The seven koma naturals keep it. */
  .strip.dense .name {
    font-size: 13px;
  }

  .name.strong {
    font-weight: 600;
  }

  .badge {
    font-size: 11px;
    font-weight: 600;
  }
</style>
