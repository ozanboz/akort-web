<script lang="ts">
  import { onDestroy } from 'svelte'
  import type { AudioFailure } from './audio/errors'
  import { Microphone } from './audio/microphone'
  import { createSettingsStore } from './settings/settings-store'
  import { deriveDisplayState, NO_SIGNAL_STATE, type DisplayState } from './tuner/display-state'
  import NoteDisplay from './ui/NoteDisplay.svelte'
  import NoteStrip from './ui/NoteStrip.svelte'
  import SettingsPanel from './ui/SettingsPanel.svelte'
  import StartScreen from './ui/StartScreen.svelte'
  import TranspositionBadge from './ui/TranspositionBadge.svelte'
  import TunerGauge from './ui/TunerGauge.svelte'

  const settings = createSettingsStore()
  const microphone = new Microphone()

  let tunerState = $state<DisplayState>(NO_SIGNAL_STATE)
  let showSettings = $state(false)
  let listening = $state(false)
  let failure = $state<AudioFailure | null>(null)

  async function start() {
    failure = null
    await microphone.start(
      (hz) => { tunerState = deriveDisplayState(hz, $settings, tunerState) },
      (reason) => { failure = reason; listening = false },
    )
    listening = failure === null
  }

  function handleVisibility() {
    if (!listening) return
    void (document.hidden ? microphone.suspend() : microphone.resume())
  }

  onDestroy(() => microphone.stop())
</script>

<svelte:document onvisibilitychange={handleVisibility} />

<main>
  {#if !listening}
    <StartScreen {failure} onStart={start} />
  {:else}
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
