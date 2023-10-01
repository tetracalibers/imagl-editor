<script lang="ts">
  export let onClick: () => void
  export let disabled = false
</script>

<button class="download-button" on:click={onClick} {disabled}>Download</button>

<style>
  .download-button {
    --button-color: #ef9595;
    appearance: none;
    border: 0;
    border-radius: 10px;
    background-color: var(--button-color);
    box-shadow: var(--button-color) 0 10px 20px -10px;
    padding: 0.5em 1em;
  }
</style>
