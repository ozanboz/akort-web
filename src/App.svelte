<script lang="ts">
  import { createSettingsStore } from './settings/settings-store'
  import { deriveDisplayState, NO_SIGNAL_STATE, type DisplayState } from './tuner/display-state'
  import NoteDisplay from './ui/NoteDisplay.svelte'
  import TunerGauge from './ui/TunerGauge.svelte'

  const settings = createSettingsStore()
  let state = $state<DisplayState>(NO_SIGNAL_STATE)

  export function pushFrequency(hz: number | null): void {
    state = deriveDisplayState(hz, $settings, state)
  }
</script>

<main>
  <TunerGauge {state} toleranceCents={$settings.toleranceCents} />
  <NoteDisplay {state} />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem 1rem;
  }
</style>
