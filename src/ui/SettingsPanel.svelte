<script lang="ts">
  import type { Writable } from 'svelte/store'
  import { chromaticAlphabet, naturalAlphabet } from '../note-systems/note-alphabet'
  import { MAX_A4, MIN_A4 } from '../note-systems/reference-pitch'
  import type { Settings } from '../settings/settings-store'

  let { settings }: { settings: Writable<Settings> } = $props()

  const chromaticNames = $derived(chromaticAlphabet($settings.noteNaming))
  const komaNames = $derived(naturalAlphabet($settings.noteNaming))
</script>

<section class="panel">
  <h2>Ayarlar</h2>

  <label>
    Nota adlandırma
    <select bind:value={$settings.noteNaming}>
      <option value="turkish">Türkçe</option>
      <option value="western">Batı</option>
    </select>
  </label>

  <label>
    Tolerans
    <select bind:value={$settings.toleranceCents}>
      <option value={3}>±3 ¢</option>
      <option value={5}>±5 ¢</option>
      <option value={10}>±10 ¢</option>
    </select>
  </label>

  <label>
    Referans perde
    <input
      type="number"
      min={MIN_A4}
      max={MAX_A4}
      step="1"
      bind:value={$settings.referenceFrequency}
    />
    Hz
  </label>

  <fieldset>
    <legend>Aktarım — kromatik</legend>
    <select bind:value={$settings.chromaticTranspositionFrom}>
      {#each chromaticNames as name, index (name)}
        <option value={index}>{name}</option>
      {/each}
    </select>
    =
    <select bind:value={$settings.chromaticTranspositionTo}>
      {#each chromaticNames as name, index (name)}
        <option value={index}>{name}</option>
      {/each}
    </select>
  </fieldset>

  <fieldset>
    <legend>Aktarım — koma</legend>
    <select bind:value={$settings.komaTranspositionFrom}>
      {#each komaNames as name, index (name)}
        <option value={index}>{name}</option>
      {/each}
    </select>
    =
    <select bind:value={$settings.komaTranspositionTo}>
      {#each komaNames as name, index (name)}
        <option value={index}>{name}</option>
      {/each}
    </select>
  </fieldset>

  <p class="note">Çaldığın nota ve artık verdiği ses. Aktarım yalnız adı değiştirir.</p>
</section>

<style>
  .panel { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 26rem; }
  label { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  fieldset { display: flex; align-items: center; gap: 0.5rem; border-radius: 0.5rem; }
  .note { font-size: 0.8rem; opacity: 0.7; margin: 0; }
</style>
