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
    --bg-color: #fff;
    --fg-color: #123ba4;
    position: relative;
    display: flex;
    align-items: center;
    max-width: 100%;
    border: 1px solid var(--fg-color);
    border-radius: 10px;
    color: var(--fg-color);
    padding: 0.5em;
    gap: 0.5em;
  }

  .button {
    display: inline-block;
    background-color: var(--bg-color);
    border: 1px dashed var(--fg-color);
    border-radius: 7px;
    padding: 0.5em 1em;
    text-transform: uppercase;
    cursor: pointer;
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
