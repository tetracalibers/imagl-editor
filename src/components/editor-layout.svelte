<script lang="ts">
  import DownloadButton from "./DownloadButton.svelte"
  import UploadInput from "./UploadInput.svelte"

  export let canvas: HTMLCanvasElement
  export let currentImage: string
  export let upload: (img: File, cb?: (src: string) => void) => void
  export let download: () => void
</script>

<div class="container">
  <div class="sidebar">
    <DownloadButton onClick={download} />
    <UploadInput onChange={(file) => upload(file, (src) => (currentImage = src))} />
    <img class="preview-before" src={currentImage} alt="" />
    <slot name="controls" />
  </div>
  <div class="main-field"><canvas class="canvas" bind:this={canvas} /></div>
</div>

<style>
  .container {
    display: flex;
    min-height: 100dvh;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1em;
    max-width: 300px;
    background-color: var(--color-bg-0);
    padding: 1em;
    box-sizing: border-box;
  }

  .main-field {
    flex: 1;
    display: grid;
    place-items: center;
  }

  .preview-before {
    width: 100%;
    object-fit: contain;
    margin: 0 auto;
  }

  .canvas {
    max-width: 90%;
  }
</style>
