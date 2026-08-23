<script lang="ts">
  import type { Writable } from 'svelte/store'
  import { chromaticAlphabet, naturalAlphabet } from '../note-systems/note-alphabet'
  import { clampA4, MAX_A4, MIN_A4 } from '../note-systems/reference-pitch'
  import type { Settings, ToleranceCents } from '../settings/settings-store'

  let { settings }: { settings: Writable<Settings> } = $props()

  const chromaticNames = $derived(chromaticAlphabet($settings.noteNaming))
  const komaNames = $derived(naturalAlphabet($settings.noteNaming))

  const TOLERANCES: ToleranceCents[] = [3, 5, 10]

  function nudgeReference(step: number) {
    settings.update((value) => ({
      ...value,
      referenceFrequency: clampA4(value.referenceFrequency + step),
    }))
  }
</script>

<section class="panel">
  <div class="card">
    <div class="row">
      <span class="label">Nota adlandırma</span>
      <div class="segmented" role="group" aria-label="Nota adlandırma">
        <button
          type="button"
          class:selected={$settings.noteNaming === 'turkish'}
          onclick={() => settings.update((value) => ({ ...value, noteNaming: 'turkish' }))}
        >
          Türkçe
        </button>
        <button
          type="button"
          class:selected={$settings.noteNaming === 'western'}
          onclick={() => settings.update((value) => ({ ...value, noteNaming: 'western' }))}
        >
          Batı
        </button>
      </div>
    </div>

    <div class="row">
      <span class="label">Tolerans</span>
      <div class="segmented numeric" role="group" aria-label="Tolerans">
        {#each TOLERANCES as tolerance (tolerance)}
          <button
            type="button"
            class:selected={$settings.toleranceCents === tolerance}
            onclick={() => settings.update((value) => ({ ...value, toleranceCents: tolerance }))}
          >
            ±{tolerance} ¢
          </button>
        {/each}
      </div>
    </div>

    <div class="row">
      <span class="label">Referans perde</span>
      <div class="stepper">
        <span class="value numeric" aria-live="polite">
          {Math.round($settings.referenceFrequency)} Hz
        </span>
        <div class="segmented">
          <button
            type="button"
            aria-label="Referans perdeyi azalt"
            disabled={$settings.referenceFrequency <= MIN_A4}
            onclick={() => nudgeReference(-1)}>−</button
          >
          <button
            type="button"
            aria-label="Referans perdeyi artır"
            disabled={$settings.referenceFrequency >= MAX_A4}
            onclick={() => nudgeReference(1)}>+</button
          >
        </div>
      </div>
    </div>
  </div>

  <div>
    <h3>Aktarım</h3>
    <div class="card">
      <div class="row">
        <span class="label">Kromatik</span>
        <div class="pair">
          <select
            aria-label="Kromatik aktarım — çalınan nota"
            bind:value={$settings.chromaticTranspositionFrom}
          >
            {#each chromaticNames as name, index (name)}
              <option value={index}>{name}</option>
            {/each}
          </select>
          <span class="equals">=</span>
          <select
            aria-label="Kromatik aktarım — duyulan ses"
            bind:value={$settings.chromaticTranspositionTo}
          >
            {#each chromaticNames as name, index (name)}
              <option value={index}>{name}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="row">
        <span class="label">Koma</span>
        <div class="pair">
          <select
            aria-label="Koma aktarımı — çalınan nota"
            bind:value={$settings.komaTranspositionFrom}
          >
            {#each komaNames as name, index (name)}
              <option value={index}>{name}</option>
            {/each}
          </select>
          <span class="equals">=</span>
          <select
            aria-label="Koma aktarımı — duyulan ses"
            bind:value={$settings.komaTranspositionTo}
          >
            {#each komaNames as name, index (name)}
              <option value={index}>{name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
    <p class="hint">Çaldığın nota ve artık verdiği ses. Aktarım yalnız adı değiştirir, ölçümü değil.</p>
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    width: 100%;
  }

  h3 {
    margin: 0 4px var(--gap-tight);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 0 16px;
    box-shadow: var(--card);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 56px;
    flex-wrap: wrap;
  }

  .row + .row {
    border-top: 1px solid var(--hairline);
  }

  .label {
    font-size: 15px;
  }

  .segmented {
    display: flex;
    gap: 2px;
    padding: 3px;
    background: var(--fill);
    border-radius: 9px;
  }

  .segmented button {
    min-height: 34px;
    padding: 0 13px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
  }

  .segmented button.selected {
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--raised);
  }

  .segmented button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .stepper .value {
    font-size: 15px;
    font-weight: 600;
  }

  .stepper .segmented button {
    width: 38px;
    padding: 0;
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--raised);
    font-size: 18px;
  }

  .pair {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .equals {
    color: var(--muted);
  }

  select {
    min-width: 72px;
    min-height: 38px;
    padding: 0 10px;
    border: 0;
    border-radius: 9px;
    background: var(--fill);
    color: var(--ink);
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    text-align: center;
  }

  .hint {
    margin: 10px 4px 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--muted);
  }
</style>
