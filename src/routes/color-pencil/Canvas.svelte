<script lang="ts">
  import { SketchFilter, type SketchFn } from "$lib/core/sketch-filter"
  import { SwapFramebufferRenderer } from "$lib/core/swap-fb"
  import { CanvasCoverPolygon } from "sketchgl/geometry"
  import { Program } from "sketchgl/program"
  import vert from "$lib/shaders/image.vert?raw"
  import frag_options from "./options.frag?raw"

  import { onMount } from "svelte"
  import defaultImage from "$lib/images/cat.jpg"
  import DownloadButton from "../../components/DownloadButton.svelte"
  import UploadInput from "../../components/UploadInput.svelte"
  import Slider from "$lib/components/control/Slider.svelte"
  import { FilterStack } from "$lib/filters/filter-stack"
  import { BlurFilter } from "$lib/filters/blur/command"
  import Checkbox from "$lib/components/control/Checkbox.svelte"
  import { LocallyFilterMask } from "$lib/filters/locally/locally"
  import { Drag } from "$lib/interactive/drag"
  import { ColorPencilFilter } from "$lib/filters/color-pencil/command"
  import { ContrastFilter } from "$lib/filters/contrast/command"

  let canvas: HTMLCanvasElement
  let download: () => void
  let upload: (img: File) => void

  let SketchCanvas: SketchFilter

  let mainFilter: ColorPencilFilter
  let uEdgeContrast: number
  let uAreaContrast: number
  let uPaperColorBright: number

  let locallyMask: LocallyFilterMask
  let mainRadius: number
  let editing = {
    main: false
  }

  const blurX = new BlurFilter({ modeIdx: 1 })
  const blurY = new BlurFilter({ modeIdx: 2 })
  const contrast = new ContrastFilter({ modeIdx: 3 })

  const filterStack = new FilterStack({ blurX, blurY, contrast })

  const sketch: SketchFn = ({ gl, canvas }) => {
    const programForOptions = new Program(gl)
    programForOptions.attach(vert, frag_options)
    programForOptions.activate()

    const uniforms = filterStack.initUniforms(gl, programForOptions.glProgram)

    const plane = new CanvasCoverPolygon(gl)
    plane.setLocations({ vertices: 0, uv: 1 })

    const stackRenderer = new SwapFramebufferRenderer(gl, canvas)

    locallyMask = new LocallyFilterMask(gl, canvas, plane)
    mainRadius = locallyMask.radius

    mainFilter = new ColorPencilFilter(gl, canvas, plane)
    uEdgeContrast = mainFilter.edgeContrast
    uAreaContrast = mainFilter.areaContrast
    uPaperColorBright = mainFilter.paperColorBright

    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clearDepth(1.0)

    return {
      preloaded(texture) {
        stackRenderer.init(texture)
      },
      drawOnFrame() {
        plane.bind()
        stackRenderer.bind(programForOptions.glProgram, "uMainTex")

        stackRenderer.beginPath()
        plane.draw({ primitive: "TRIANGLES" })
        stackRenderer.endPath()

        locallyMask.saveBase(programForOptions, stackRenderer)
        mainFilter.apply(programForOptions, stackRenderer)
        locallyMask.applyMask(programForOptions, stackRenderer)

        filterStack.activeAfterFilters.forEach((filter) => {
          stackRenderer.beginPath()
          uniforms && filter.applyUniforms(uniforms)
          plane.draw({ primitive: "TRIANGLES" })
          stackRenderer.endPath()
        })

        stackRenderer.switchToCanvas()
        uniforms && uniforms.int("uFilterMode", 0)
        plane.draw({ primitive: "TRIANGLES" })
      },
      resize: [...mainFilter.resizes, ...locallyMask.resizes, stackRenderer.resize]
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

    const watchDrag = new Drag(canvas)
    watchDrag.onMove = (pos) => {
      if (editing.main) {
        locallyMask.center = pos
      }
    }

    await SketchCanvas.start(defaultImage)
  })
</script>

<DownloadButton onClick={download} />
<UploadInput onChange={upload} />
<canvas bind:this={canvas} />

<div>
  <Checkbox
    bind:on={editing.main}
    onChange={(on) => {
      if (on) {
        editing.main = true
      } else {
        editing.main = false
      }
    }}
  >
    移動モード
  </Checkbox>

  半径<Slider
    bind:value={mainRadius}
    onChange={(v) => {
      locallyMask.radius = v
    }}
    min={0}
    max={1}
    step={0.01}
  />
</div>

<div>
  線の薄さ<Slider
    bind:value={uEdgeContrast}
    onChange={(v) => (mainFilter.edgeContrast = v)}
    min={0.0}
    max={1.0}
    step={0.01}
  />
</div>

<div>
  色の薄さ<Slider
    bind:value={uAreaContrast}
    onChange={(v) => (mainFilter.areaContrast = v)}
    min={0.7}
    max={1.0}
    step={0.01}
  />
</div>

<div>
  紙の明るさ<Slider
    bind:value={uPaperColorBright}
    onChange={(v) => (mainFilter.paperColorBright = v)}
    min={0.7}
    max={1.0}
    step={0.01}
  />
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
    max={1.0}
    step={0.01}
  />
</div>
