<script lang="ts">
  import { onDestroy } from 'svelte'
  import type { AudioFailure } from './audio/errors'
  import { Microphone } from './audio/microphone'
  import { createSettingsStore } from './settings/settings-store'
  import { deriveDisplayState, NO_SIGNAL_STATE, type DisplayState } from './tuner/display-state'
  import Logo from './ui/Logo.svelte'
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
      (hz) => {
        tunerState = deriveDisplayState(hz, $settings, tunerState)
      },
      (reason) => {
        failure = reason
        listening = false
      },
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

{#if !listening}
  <StartScreen {failure} onStart={start} />
{:else}
  <div class="app">
    <header>
      <span class="brand"><Logo size={20} />Akort+</span>
    </header>

    <div class="body">
      <main>
        <div class="readout">
          <TunerGauge state={tunerState} toleranceCents={$settings.toleranceCents} />
          <NoteDisplay state={tunerState} />
          <NoteStrip state={tunerState} settings={$settings} />
          <TranspositionBadge settings={$settings} />
        </div>

        <div class="modes" role="group" aria-label="Akort modu">
          <button
            type="button"
            class:selected={$settings.tuningMode === 'chromatic'}
            onclick={() => settings.update((value) => ({ ...value, tuningMode: 'chromatic' }))}
          >
            Kromatik
          </button>
          <button
            type="button"
            class:selected={$settings.tuningMode === 'koma'}
            onclick={() => settings.update((value) => ({ ...value, tuningMode: 'koma' }))}
          >
            Koma
          </button>
        </div>

        <div class="summary">
          <span class="numeric">
            A4 = {Math.round($settings.referenceFrequency)} Hz · ±{$settings.toleranceCents} ¢
          </span>
          <button
            type="button"
            class="settings-toggle"
            aria-expanded={showSettings}
            onclick={() => (showSettings = !showSettings)}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="2.6" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M10 3.2v2.1M10 14.7v2.1M16.8 10h-2.1M5.3 10H3.2M14.8 5.2l-1.5 1.5M6.7 13.3l-1.5 1.5M14.8 14.8l-1.5-1.5M6.7 6.7L5.2 5.2"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            {showSettings ? 'Ayarları kapat' : 'Ayarlar'}
          </button>
        </div>
      </main>

      <aside class:open={showSettings}>
        <SettingsPanel {settings} />
      </aside>
    </div>
  </div>
{/if}

<style>
  .app {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: 28px 20px 24px;
    max-width: 1280px;
    margin: 0 auto;
  }

  header {
    flex-shrink: 0;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--accent);
    font-size: 15px;
    font-weight: 700;
  }

  .body {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
  }

  /* The readout takes the free space and centres itself in it, so the mode
     switch and the summary stay pinned near the thumb instead of floating
     under a tall gap. */
  .readout {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: var(--gap);
    width: 100%;
  }

  .modes {
    display: flex;
    gap: 4px;
    padding: 4px;
    width: 100%;
    background: var(--fill);
    border-radius: var(--radius);
  }

  .modes button {
    flex: 1 1 0;
    min-height: 44px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--muted);
    font-size: 15px;
    font-weight: 600;
  }

  .modes button.selected {
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--raised);
  }

  .summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 0 4px;
    color: var(--muted);
    font-size: 13px;
  }

  .settings-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
  }

  .settings-toggle svg {
    width: 16px;
    height: 16px;
  }

  aside {
    display: none;
    width: 100%;
    max-width: 420px;
    margin: var(--gap) auto 0;
  }

  aside.open {
    display: block;
  }

  /* Wide enough for a rail: settings stay open beside the tuner, because the
     only reason they fold away on a phone is that there is no room. */
  @media (min-width: 900px) {
    .body {
      flex-direction: row;
      align-items: stretch;
      gap: 40px;
    }

    main {
      max-width: 620px;
      margin: 0;
    }

    /* Cap the dial rather than letting it grow with the column: past this it
       stops reading as an instrument and starts reading as wallpaper. */
    .readout :global(.gauge) {
      max-width: 520px;
    }

    aside {
      display: block;
      width: 340px;
      max-width: none;
      margin: 0;
      padding-left: 40px;
      border-left: 1px solid var(--hairline);
      align-self: center;
    }

    .settings-toggle {
      display: none;
    }

    :global(:root) {
      --note-size: 92px;
    }
  }
</style>
