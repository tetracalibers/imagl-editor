<script lang="ts">
  import { SketchFilter, type SketchFn } from "$lib/core/sketch-filter"
  import { SwapFramebufferRenderer } from "$lib/core/swap-fb"
  import { CanvasCoverPolygon } from "sketchgl/geometry"
  import { Program } from "sketchgl/program"
  import vert from "$lib/shaders/image.vert?raw"
  import frag_options from "./options.frag?raw"
  import { onMount } from "svelte"
  import defaultImage from "$lib/images/autumn-leaves_00037.jpg"
  import DownloadButton from "../../components/DownloadButton.svelte"
  import UploadInput from "../../components/UploadInput.svelte"
  import Slider from "$lib/components/control/Slider.svelte"
  import { FilterStack } from "$lib/filters/filter-stack"
  import { BlurFilter } from "$lib/filters/blur/command"
  import Checkbox from "$lib/components/control/Checkbox.svelte"
  import { ContrastFilter } from "$lib/filters/contrast/command"
  import { VoronoiStainedGlassFilter } from "$lib/filters/voronoi-stained-glass/command"

  let canvas: HTMLCanvasElement
  let download: () => void
  let upload: (img: File) => void

  let SketchCanvas: SketchFilter

  let uAlpha = 0.9

  const blurX = new BlurFilter({ modeIdx: 1 })
  const blurY = new BlurFilter({ modeIdx: 2 })
  const contrast = new ContrastFilter({ modeIdx: 3 })
  const staindGlass = new VoronoiStainedGlassFilter({ modeIdx: 4 })

  const filterStack = new FilterStack({ blurX, blurY, contrast, staindGlass })

  const sketch: SketchFn = ({ gl, canvas }) => {
    const programForOptions = new Program(gl)
    programForOptions.attach(vert, frag_options)
    programForOptions.activate()

    const uniforms = filterStack.initUniforms(gl, programForOptions.glProgram, ["uAlpha"])

    const plane = new CanvasCoverPolygon(gl)
    plane.setLocations({ vertices: 0, uv: 1 })

    const stackRenderer = new SwapFramebufferRenderer(gl, canvas)

    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clearDepth(1.0)

    return {
      preloaded(texture) {
        stackRenderer.init(texture)
      },
      drawOnFrame() {
        plane.bind()
        stackRenderer.bind(programForOptions.glProgram, "uMainTex")
        uniforms && uniforms.float("uAlpha", 1.0)

        stackRenderer.beginPath()
        uniforms && uniforms.int("uFilterMode", 0)
        plane.draw({ primitive: "TRIANGLES" })
        stackRenderer.endPath()

        filterStack.activeBeforeFilters.forEach((filter) => {
          stackRenderer.beginPath()
          uniforms && filter.applyUniforms(uniforms)
          plane.draw({ primitive: "TRIANGLES" })
          stackRenderer.endPath()
        })

        stackRenderer.beginPath()
        uniforms && staindGlass.applyUniforms(uniforms)
        plane.draw({ primitive: "TRIANGLES" })
        stackRenderer.endPath()

        filterStack.activeAfterFilters.forEach((filter) => {
          stackRenderer.beginPath()
          uniforms && filter.applyUniforms(uniforms)
          plane.draw({ primitive: "TRIANGLES" })
          stackRenderer.endPath()
        })

        stackRenderer.switchToCanvas()
        uniforms && uniforms.int("uFilterMode", 0)
        uniforms && uniforms.float("uAlpha", uAlpha)
        plane.draw({ primitive: "TRIANGLES" })
      },
      resize: [stackRenderer.resize]
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
  モザイクの強さ<Slider bind:value={staindGlass.uVoronoiMixRatio} min={0.5} max={1} step={0.01} />
</div>
<div>
  モザイクの細かさ<Slider bind:value={staindGlass.uVoronoiSiteCount} min={3} max={100} step={1} />
</div>

<div>
  透明度<Slider bind:value={uAlpha} onChange={(v) => (uAlpha = v)} min={0} max={1} step={0.01} />
</div>

<div>
  <Checkbox
    bind:on={contrast.active}
    onChange={(on) => {
      if (on) {
        filterStack.active("contrast", { before: true })
      } else {
        filterStack.deactive("contrast", { before: true })
      }
    }}
  >
    Contrast
  </Checkbox>
  <Slider
    bind:value={contrast.uContrastGamma}
    disabled={!contrast.active}
    min={0.1}
    max={10}
    step={0.1}
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
    max={1}
    step={0.01}
  />
</div>
