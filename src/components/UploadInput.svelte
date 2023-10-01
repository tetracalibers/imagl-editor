<script lang="ts">
  export let onChange: (file: File) => void

  let files: FileList
</script>

<div class="upload-area">
  <span class="button">select image</span>
  {#if files}
    <span class="hint">{files[0].name}</span>
  {/if}
  <input
    class="input"
    type="file"
    accept="image/png, image/jpeg"
    bind:files
    on:change={() => onChange(files[0])}
  />
</div>

<style>
  .upload-area {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 100%;
    border: 2px dashed #8ddfcb;
    border-radius: 10px;
    padding: 0.5em;
    gap: 0.5em;
  }

  .button {
    --button-color: #8ddfcb;
    display: inline-block;
    background-color: var(--button-color);
    box-shadow: var(--button-color) 0 10px 20px -10px;
    border-radius: 7px;
    padding: 0.5em 1em;
    text-transform: capitalize;
  }

  .hint {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .input {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    opacity: 0;
    cursor: pointer;
  }
</style>
