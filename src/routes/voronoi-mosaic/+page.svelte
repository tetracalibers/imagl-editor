<script lang="ts">
  import { SketchFilter, type SketchFn } from "$lib/core/sketch-filter"
  import { SwapFramebufferRenderer } from "$lib/core/swap-fb"
  import { CanvasCoverPolygon } from "sketchgl/geometry"
  import { Program } from "sketchgl/program"
  import vert from "$lib/shaders/image.vert?raw"
  import frag_options from "./options.frag?raw"
  import { onMount } from "svelte"
  import defaultImage from "$lib/images/fantasy-unicorn.jpg"
  import Slider from "$lib/components/control/Slider.svelte"
  import { FilterStack } from "$lib/filters/filter-stack"
  import { BlurFilter } from "$lib/filters/blur/command"
  import { VoronoiWatercolorFilter } from "$lib/filters/voronoi-mosaic/command"
  import { ContrastFilter } from "$lib/filters/contrast/command"
  import { LocallyFilterMask } from "$lib/filters/locally/locally"
  import { Drag } from "$lib/interactive/drag"
  import EditorLayout from "$lib/components/layout/editor-layout.svelte"
  import ControlItem from "$lib/components/control/control-item.svelte"
  import Switch from "$lib/components/control/Switch.svelte"

  let canvas: HTMLCanvasElement
  let download: () => void
  let upload: (img: File) => void

  let SketchCanvas: SketchFilter

  let mainFilter: VoronoiWatercolorFilter
  let uMixRatio: number

  let uAlpha = 1.0

  const blurX = new BlurFilter({ modeIdx: 1 })
  const blurY = new BlurFilter({ modeIdx: 2 })
  const contrast = new ContrastFilter({ modeIdx: 3 })

  const filterStack = new FilterStack({ blurX, blurY, contrast })

  let locallyMask: LocallyFilterMask
  let mainRadius: number
  let editing = {
    main: false
  }

  const sketch: SketchFn = ({ gl, canvas }) => {
    const programForOptions = new Program(gl)
    programForOptions.attach(vert, frag_options)
    programForOptions.activate()

    const uniforms = filterStack.initUniforms(gl, programForOptions.glProgram, ["uAlpha"])

    const plane = new CanvasCoverPolygon(gl)
    plane.setLocations({ vertices: 0, uv: 1 })

    const stackRenderer = new SwapFramebufferRenderer(gl, canvas)

    locallyMask = new LocallyFilterMask(gl, canvas, plane)
    mainRadius = locallyMask.radius

    mainFilter = new VoronoiWatercolorFilter(gl, canvas, plane)
    uMixRatio = mainFilter.mixRatio

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    gl.clearDepth(1.0)

    return {
      preloaded(texture) {
        stackRenderer.init(texture)
        mainFilter.setup(canvas.width, canvas.height)
      },
      drawOnFrame() {
        plane.bind()
        stackRenderer.bind(programForOptions.glProgram, "uMainTex")

        stackRenderer.beginPath()
        uniforms && uniforms.int("uFilterMode", 0)
        uniforms && uniforms.float("uAlpha", uAlpha)
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
      resize: [
        () => {
          mainFilter.setup(canvas.width, canvas.height)
        },
        ...mainFilter.resizes,
        ...locallyMask.resizes,
        stackRenderer.resize
      ]
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

<EditorLayout bind:canvas currentImage={defaultImage} {upload} {download}>
  <svelte:fragment slot="controls">
    <ControlItem title="移動モード">
      <Switch
        bind:on={editing.main}
        onChange={(on) => {
          if (on) {
            editing.main = true
          } else {
            editing.main = false
          }
        }}
      />
    </ControlItem>
    <ControlItem title="半径">
      <Slider
        bind:value={mainRadius}
        onChange={(v) => {
          locallyMask.radius = v
        }}
        min={0}
        max={1}
        step={0.01}
      />
    </ControlItem>
    <ControlItem title="モザイクの強さ">
      <Slider
        bind:value={uMixRatio}
        onChange={(v) => (mainFilter.mixRatio = v)}
        min={0}
        max={1}
        step={0.01}
      />
    </ControlItem>
    <ControlItem title="透明度">
      <Slider bind:value={uAlpha} onChange={(v) => (uAlpha = v)} min={0} max={1} step={0.01} />
    </ControlItem>
    <ControlItem title="コントラスト調整">
      <Switch
        bind:on={contrast.active}
        onChange={(on) => {
          if (on) {
            filterStack.active("contrast")
          } else {
            filterStack.deactive("contrast")
          }
        }}
      />
    </ControlItem>
    <ControlItem title="コントラスト">
      <Slider
        bind:value={contrast.uContrastGamma}
        disabled={!contrast.active}
        min={0.1}
        max={10}
        step={0.1}
      />
    </ControlItem>
    <ControlItem title="ぼかし">
      <Switch
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
      />
    </ControlItem>

    <ControlItem title="ぼかしの強さ">
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
    </ControlItem>
  </svelte:fragment>
</EditorLayout>
