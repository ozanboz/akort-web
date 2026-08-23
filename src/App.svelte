<script lang="ts">
  import { createSettingsStore } from './settings/settings-store'
  import { deriveDisplayState, NO_SIGNAL_STATE, type DisplayState } from './tuner/display-state'
  import NoteDisplay from './ui/NoteDisplay.svelte'
  import NoteStrip from './ui/NoteStrip.svelte'
  import SettingsPanel from './ui/SettingsPanel.svelte'
  import TranspositionBadge from './ui/TranspositionBadge.svelte'
  import TunerGauge from './ui/TunerGauge.svelte'

  const settings = createSettingsStore()
  let tunerState = $state<DisplayState>(NO_SIGNAL_STATE)
  let showSettings = $state(false)

  export function pushFrequency(hz: number | null): void {
    tunerState = deriveDisplayState(hz, $settings, tunerState)
  }
</script>

<main>
  <TunerGauge state={tunerState} toleranceCents={$settings.toleranceCents} />
  <NoteDisplay state={tunerState} />
  <NoteStrip state={tunerState} settings={$settings} />
  <TranspositionBadge settings={$settings} />

  <div class="modes">
    <button type="button" class:selected={$settings.tuningMode === 'chromatic'}
            onclick={() => settings.update((value) => ({ ...value, tuningMode: 'chromatic' }))}>
      Kromatik
    </button>
    <button type="button" class:selected={$settings.tuningMode === 'koma'}
            onclick={() => settings.update((value) => ({ ...value, tuningMode: 'koma' }))}>
      Koma
    </button>
  </div>

  <button type="button" onclick={() => (showSettings = !showSettings)}>
    {showSettings ? 'Ayarları kapat' : 'Ayarlar'}
  </button>

  {#if showSettings}
    <SettingsPanel {settings} />
  {/if}
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem 1rem;
  }
  .modes { display: flex; gap: 0.5rem; }
  .modes .selected { font-weight: 600; outline: 2px solid currentColor; }
</style>
