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

  let mainFilter: VoronoiStainedGlassFilter
  let uVoronoiSiteCount: number
  let uVoronoiMixRatio: number
  let uRandomMixRatio: number
  let uGlowScale: number

  let uAlpha = 0.9

  const blurX = new BlurFilter({ modeIdx: 1 })
  const blurY = new BlurFilter({ modeIdx: 2 })
  const contrast = new ContrastFilter({ modeIdx: 3 })

  const filterStack = new FilterStack({ blurX, blurY, contrast })

  const sketch: SketchFn = ({ gl, canvas }) => {
    const programForOptions = new Program(gl)
    programForOptions.attach(vert, frag_options)
    programForOptions.activate()

    const uniforms = filterStack.initUniforms(gl, programForOptions.glProgram, ["uAlpha"])

    const plane = new CanvasCoverPolygon(gl)
    plane.setLocations({ vertices: 0, uv: 1 })

    const stackRenderer = new SwapFramebufferRenderer(gl, canvas)

    mainFilter = new VoronoiStainedGlassFilter(gl, canvas, plane)
    uVoronoiSiteCount = mainFilter.uVoronoiSiteCount
    uVoronoiMixRatio = mainFilter.uVoronoiMixRatio
    uRandomMixRatio = mainFilter.uRandomMixRatio
    uGlowScale = mainFilter.uGlowScale

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

        mainFilter.apply(programForOptions, stackRenderer)

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
  モザイクの強さ<Slider
    bind:value={uVoronoiMixRatio}
    onChange={(v) => (mainFilter.uVoronoiMixRatio = v)}
    min={0.5}
    max={1}
    step={0.01}
  />
</div>
<div>
  ガラスの色の濃さ<Slider
    bind:value={uRandomMixRatio}
    onChange={(v) => (mainFilter.uRandomMixRatio = v)}
    min={0.01}
    max={1}
    step={0.01}
  />
</div>
<div>
  ガラスの背後の明るさ<Slider
    bind:value={uGlowScale}
    onChange={(v) => (mainFilter.uGlowScale = v)}
    min={0.01}
    max={1}
    step={0.01}
  />
</div>
<div>
  モザイクの細かさ<Slider
    bind:value={uVoronoiSiteCount}
    onChange={(v) => (mainFilter.uVoronoiSiteCount = v)}
    min={3}
    max={100}
    step={1}
  />
</div>

<div>
  透明度<Slider bind:value={uAlpha} onChange={(v) => (uAlpha = v)} min={0} max={1} step={0.01} />
</div>

<div>
  <Checkbox
    bind:on={contrast.active}
    onChange={(on) => {
      if (on) {
        filterStack.active("contrast")
      } else {
        filterStack.deactive("contrast")
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
