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
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    background: color-mix(in srgb, currentColor 12%, transparent);
    font-size: 0.85rem;
  }
</style>
