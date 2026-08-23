<script lang="ts">
  import type { AudioFailure } from '../audio/errors'
  import { failureCopy } from './failure-copy'

  let { failure = null, onStart }: { failure?: AudioFailure | null; onStart: () => void } = $props()

  const copy = $derived(failure === null ? null : failureCopy(failure))
</script>

<section class="start">
  {#if copy}
    <h2>{copy.title}</h2>
    <p>{copy.body}</p>
    {#if copy.canRetry}
      <button type="button" onclick={onStart}>Yeniden dene</button>
    {/if}
  {:else}
    <h2>Akort+</h2>
    <p>Başlat'a bastığında tarayıcı mikrofon izni isteyecek. Ses cihazından çıkmaz.</p>
    <button type="button" onclick={onStart}>Akorda başla</button>
  {/if}
</section>

<style>
  .start { display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; }
</style>
