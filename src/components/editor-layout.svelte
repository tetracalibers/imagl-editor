<script lang="ts">
  import DownloadButton from "./DownloadButton.svelte"
  import UploadInput from "./UploadInput.svelte"

  export let canvas: HTMLCanvasElement
  export let currentImage: string
  export let upload: (img: File, cb?: (src: string) => void) => void
  export let download: () => void

  let img: HTMLImageElement
</script>

<div class="container">
  <div class="sidebar">
    <DownloadButton onClick={download} />
    <UploadInput
      onChange={(file) => {
        upload(file, (src) => (img.src = src))
      }}
    />
    <img class="preview-before" bind:this={img} src={currentImage} alt="" />
    <slot name="controls" />
  </div>
  <div class="main-field"><canvas class="canvas" bind:this={canvas} /></div>
</div>

<style>
  :global(body):has(canvas) {
    overscroll-behavior: none;
  }

  .container {
    display: flex;
    height: 100dvh;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1em;
    max-width: 300px;
    background-color: #fff;
    padding: 1em;
    box-sizing: border-box;
    height: 100dvh;
    overflow-y: auto;
  }

  .main-field {
    flex: 1;
    display: grid;
    place-items: center;
    background: #faffff;
    background-image: linear-gradient(#9fc9c7 1.5px, rgba(255, 255, 255, 0) 0),
      linear-gradient(90deg, #9fc9c7 1.5px, rgba(255, 255, 255, 0) 0),
      linear-gradient(#bbcacf 1.5px, rgba(255, 255, 255, 0) 0),
      linear-gradient(90deg, #bbcacf 1.5px, rgba(255, 255, 255, 0) 0);
    background-size: 75px 75px, 75px 75px, 15px 15px, 15px 15px;
    max-height: 100dvh;
  }

  .preview-before {
    width: 100%;
    object-fit: contain;
    margin: 0 auto;
  }

  .canvas {
    max-width: 90%;
  }

  @media (width < 700px) {
    .container {
      flex-direction: column;
    }

    .sidebar {
      order: 2;
      max-width: 100%;
      padding-block: 2em;
      padding-inline: 15%;
      height: 100%;
      overflow-y: visible;
    }

    .main-field {
      padding: 2em 1em;
    }

    .preview-before {
      order: -1;
    }
  }
</style>
