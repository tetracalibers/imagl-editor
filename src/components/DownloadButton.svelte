<script lang="ts">
  export let onClick: () => void
  export let disabled = false
</script>

<button class="download-button" on:click={onClick} {disabled}>Download</button>

<style>
  .download-button {
    --bg-color: #fff;
    --fg-color: #123ba4;
    appearance: none;
    border: 1px solid var(--fg-color);
    color: var(--fg-color);
    border-radius: 10px;
    background-color: var(--bg-color);
    padding: 0.5em 1em;
    text-transform: uppercase;
  }
</style>
