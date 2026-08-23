<script lang="ts">
  let { size = 20 }: { size?: number } = $props()
</script>

<svg viewBox="0 0 24 24" fill="none" width={size} height={size} aria-hidden="true">
  <path
    d="M8.2 3.4 V13 a3.8 3.8 0 0 0 7.6 0 V3.4"
    stroke="currentColor"
    stroke-width="3.2"
    stroke-linecap="round"
  />
  <path d="M12 16.8 V20.6" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" />
</svg>
