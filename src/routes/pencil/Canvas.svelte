<script lang="ts">
  import { SketchFilter, type SketchFn } from "$lib/core/sketch-filter"
  import { SwapFramebufferRenderer } from "$lib/core/swap-fb"
  import { CanvasCoverPolygon } from "sketchgl/geometry"
  import { Program } from "sketchgl/program"
  import vert from "$lib/shaders/image.vert?raw"
  import frag_options from "./options.frag?raw"
  import { PencilFilter } from "$lib/filters/pencil/command"
  import { onMount } from "svelte"
  import defaultImage from "$lib/images/autumn-leaves_00037.jpg"
  import DownloadButton from "../../components/DownloadButton.svelte"
  import UploadInput from "../../components/UploadInput.svelte"

  let canvas: HTMLCanvasElement
  let download: () => void
  let upload: (img: File) => void

  let SketchCanvas: SketchFilter

  const sketch: SketchFn = ({ gl, canvas }) => {
    const programForOptions = new Program(gl)
    programForOptions.attach(vert, frag_options)

    const plane = new CanvasCoverPolygon(gl)
    plane.setLocations({ vertices: 0, uv: 1 })

    const stackRenderer = new SwapFramebufferRenderer(gl, canvas)

    const mainFilter = new PencilFilter(gl, canvas, plane)

    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clearDepth(1.0)

    return {
      preloaded(texture) {
        stackRenderer.init(texture)
      },
      drawOnFrame() {
        plane.bind()
        stackRenderer.bind(mainFilter.glProgram, "uOriginalTex")

        const { outBuf } = stackRenderer.beginPath()
        mainFilter.apply(outBuf)

        stackRenderer.switchToCanvas()
        plane.draw({ primitive: "TRIANGLES" })
      },
      resize: [mainFilter.resize]
    }
  }

  onMount(async () => {
    const config = {
      canvas: {
        el: canvas,
        autoResize: true
      }
    }
    SketchCanvas = new SketchFilter(config, sketch)
    download = SketchCanvas.download
    upload = SketchCanvas.changeImage

    await SketchCanvas.start(defaultImage)
  })
</script>

<DownloadButton onClick={download} />
<UploadInput onChange={upload} />
<canvas bind:this={canvas} />
