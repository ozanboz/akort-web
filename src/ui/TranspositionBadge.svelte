<script lang="ts">
  import { chromaticSemitoneShift } from '../note-systems/chromatic-grid'
  import { komaShift } from '../note-systems/koma-grid'
  import { chromaticAlphabet, naturalAlphabet } from '../note-systems/note-alphabet'
  import type { Settings } from '../settings/settings-store'

  let { settings }: { settings: Settings } = $props()

  const isKoma = $derived(settings.tuningMode === 'koma')
  const names = $derived(
    isKoma ? naturalAlphabet(settings.noteNaming) : chromaticAlphabet(settings.noteNaming),
  )
  const from = $derived(
    isKoma ? settings.komaTranspositionFrom : settings.chromaticTranspositionFrom,
  )
  const to = $derived(isKoma ? settings.komaTranspositionTo : settings.chromaticTranspositionTo)
  const shift = $derived(isKoma ? komaShift(from, to) : chromaticSemitoneShift(from, to))
</script>

{#if shift !== 0}
  <p class="badge">Aktarım: {names[from]} = {names[to]}</p>
{/if}

<style>
  .badge {
    margin: 0;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(30, 143, 130, 0.12);
    color: var(--accent-deep);
    font-size: 13px;
    font-weight: 600;
  }

  @media (prefers-color-scheme: dark) {
    .badge {
      color: var(--accent);
    }
  }
</style>
