<script lang="ts">
  import type { AudioFailure } from '../audio/errors'
  import { failureCopy } from './failure-copy'
  import Logo from './Logo.svelte'

  let { failure = null, onStart }: { failure?: AudioFailure | null; onStart: () => void } = $props()

  const copy = $derived(failure === null ? null : failureCopy(failure))
</script>

{#if copy}
  <section class="failure">
    <div class="icon" class:retryable={copy.canRetry}>
      {#if copy.canRetry}
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="2.6" width="6" height="11" rx="3" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M5.5 11.2a6.5 6.5 0 0 0 13 0M12 17.7v3.7"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path d="M3.4 3.4 L20.6 20.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
          <path d="M12 7.4v5.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="12" cy="16.4" r="1.05" fill="currentColor" />
        </svg>
      {/if}
    </div>

    <h2>{copy.title}</h2>
    <p>{copy.body}</p>

    {#if copy.canRetry}
      <button type="button" class="retry" onclick={onStart}>Yeniden dene</button>
    {/if}
  </section>
{:else}
  <section class="welcome">
    <Logo size={104} />
    <h1>Akort+</h1>
    <p class="pitch">Türk müziği koma sistemi ve kromatik akort, doğrudan tarayıcıda.</p>
    <button type="button" class="start" onclick={onStart}>Akorda başla</button>
    <p class="consent">
      Tarayıcı mikrofon izni isteyecek. Ses cihazından çıkmaz, hiçbir yere gönderilmez.
    </p>
    <p class="footnote">
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="4" y="8.6" width="12" height="8" rx="2.2" stroke="currentColor" stroke-width="1.5" />
        <path d="M7 8.6V6.4a3 3 0 0 1 6 0v2.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      Kayıt yok, hesap yok
    </p>
  </section>
{/if}

<style>
  .welcome {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 40px 32px;
    text-align: center;
    background: linear-gradient(180deg, var(--brand-top) 0%, var(--brand-bottom) 100%);
    color: #ffffff;
  }

  .welcome h1 {
    margin: 24px 0 0;
    font-size: 40px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .pitch {
    margin: 12px 0 40px;
    max-width: 280px;
    font-size: 16px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.86);
  }

  .start {
    width: 100%;
    max-width: 300px;
    min-height: 56px;
    border: 0;
    border-radius: var(--radius);
    background: #ffffff;
    color: #04564f;
    font-size: 17px;
    font-weight: 700;
    box-shadow: 0 8px 24px rgba(2, 58, 55, 0.28);
  }

  .consent {
    margin: 20px 0 0;
    max-width: 300px;
    font-size: 13px;
    line-height: 1.55;
    color: rgba(255, 255, 255, 0.72);
  }

  .footnote {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 40px 0 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }

  .footnote svg {
    width: 15px;
    height: 15px;
  }

  .failure {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 40px 32px;
    text-align: center;
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 999px;
    background: var(--fill);
    color: var(--muted);
  }

  .icon.retryable {
    background: rgba(224, 132, 44, 0.14);
    color: var(--off-tune);
  }

  .icon svg {
    width: 30px;
    height: 30px;
  }

  .failure h2 {
    margin: 20px 0 0;
    font-size: 20px;
    font-weight: 700;
  }

  .failure p {
    margin: 8px 0 0;
    max-width: 320px;
    font-size: 15px;
    line-height: 1.55;
    color: var(--muted);
  }

  .retry {
    width: 100%;
    max-width: 300px;
    min-height: 52px;
    margin-top: 28px;
    border: 0;
    border-radius: var(--radius);
    background: var(--accent);
    color: #ffffff;
    font-size: 16px;
    font-weight: 700;
  }
</style>
