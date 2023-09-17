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
  import Slider from "$lib/components/control/Slider.svelte"
  import { FilterStack } from "$lib/filters/filter-stack"
  import { BlurFilter } from "$lib/filters/blur/command"
  import Checkbox from "$lib/components/control/Checkbox.svelte"

  let canvas: HTMLCanvasElement
  let download: () => void
  let upload: (img: File) => void

  let SketchCanvas: SketchFilter

  let mainFilter: PencilFilter
  let uPencilGamma: number

  const blurX = new BlurFilter({ modeIdx: 1 })
  const blurY = new BlurFilter({ modeIdx: 2 })

  const filterStack = new FilterStack({ blurX, blurY })

  const sketch: SketchFn = ({ gl, canvas }) => {
    const programForOptions = new Program(gl)
    programForOptions.attach(vert, frag_options)
    programForOptions.activate()

    const uniforms = filterStack.initUniforms(gl, programForOptions.glProgram)

    const plane = new CanvasCoverPolygon(gl)
    plane.setLocations({ vertices: 0, uv: 1 })

    const stackRenderer = new SwapFramebufferRenderer(gl, canvas)

    mainFilter = new PencilFilter(gl, canvas, plane)
    uPencilGamma = mainFilter.gamma

    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clearDepth(1.0)

    return {
      preloaded(texture) {
        stackRenderer.init(texture)
      },
      drawOnFrame() {
        uniforms && uniforms.int("uFilterMode", 0)

        plane.bind()
        stackRenderer.bind(mainFilter.glProgram, "uOriginalTex")

        const { outBuf } = stackRenderer.beginPath()
        mainFilter.apply(programForOptions, outBuf)

        filterStack.activeFilters.forEach((filter) => {
          stackRenderer.beginPath()
          uniforms && filter.applyUniforms(uniforms)
          plane.draw({ primitive: "TRIANGLES" })
          stackRenderer.endPath()
        })

        stackRenderer.switchToCanvas()
        plane.draw({ primitive: "TRIANGLES" })
      },
      resize: [...mainFilter.resizes, stackRenderer.resize]
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

<div>
  線の薄さ<Slider
    bind:value={uPencilGamma}
    onChange={(v) => (mainFilter.gamma = v)}
    min={0}
    max={1}
    step={0.01}
  />
</div>

<div>
  <Checkbox
    bind:on={blurX.active}
    onChange={(on) => {
      if (on) {
        filterStack.active("blurX")
        filterStack.active("blurY")
      } else {
        filterStack.deactive("blurX")
        filterStack.deactive("blurY")
      }
    }}
  >
    Blur
  </Checkbox>
  <Slider
    bind:value={blurX.uBlurSigma}
    onChange={(v) => {
      blurX.uBlurSigma = v
      blurY.uBlurSigma = v
    }}
    disabled={!blurX.active}
    min={0.01}
    max={1.0}
    step={0.01}
  />
</div>
