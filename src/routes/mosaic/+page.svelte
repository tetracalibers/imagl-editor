<script lang="ts">
  import { SketchFilter, type SketchFn } from "$lib/core/sketch-filter"
  import { SwapFramebufferRenderer } from "$lib/core/swap-fb"
  import { CanvasCoverPolygon } from "sketchgl/geometry"
  import { Program } from "sketchgl/program"
  import vert from "$lib/shaders/image.vert?raw"
  import frag_options from "./options.frag?raw"
  import { onMount } from "svelte"
  import defaultImage from "$lib/images/autumn-leaves_00037.jpg"
  import Slider from "$lib/components/control/Slider.svelte"
  import { FilterStack } from "$lib/filters/filter-stack"
  import Checkbox from "$lib/components/control/Checkbox.svelte"
  import { LocallyMosaicFilter } from "$lib/filters/mosaic/locally"
  import { MosaicAreaController } from "$lib/filters/mosaic/control"
  import { ContrastFilter } from "$lib/filters/contrast/command"
  import EditorLayout from "../../components/editor-layout.svelte"

  let canvas: HTMLCanvasElement
  let download: () => void
  let upload: (img: File) => void

  let SketchCanvas: SketchFilter

  let mosaicFilter: LocallyMosaicFilter
  let mosaicActive: boolean
  let mosaicScale: number
  let mosaicRadius: number

  let mosaicController: MosaicAreaController
  let mosaicEditing: boolean

  const contrast = new ContrastFilter({ modeIdx: 1 })

  const filterStack = new FilterStack({ contrast })

  const sketch: SketchFn = ({ gl, canvas }) => {
    const programForOptions = new Program(gl)
    programForOptions.attach(vert, frag_options)
    programForOptions.activate()

    const uniforms = filterStack.initUniforms(gl, programForOptions.glProgram)

    const plane = new CanvasCoverPolygon(gl)
    plane.setLocations({ vertices: 0, uv: 1 })

    const stackRenderer = new SwapFramebufferRenderer(gl, canvas)

    mosaicFilter = new LocallyMosaicFilter(gl, canvas, plane)
    mosaicActive = mosaicFilter.active
    mosaicScale = mosaicFilter.scale
    mosaicRadius = mosaicFilter.radius
    mosaicController = new MosaicAreaController(canvas, mosaicFilter)
    mosaicEditing = mosaicController.editing

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
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

        mosaicActive && mosaicFilter.applyLocally(programForOptions, stackRenderer)

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
      resize: [...mosaicFilter.resizes, stackRenderer.resize]
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

<EditorLayout bind:canvas currentImage={defaultImage} {upload} {download}>
  <div slot="controls">
    <div>
      <Checkbox bind:on={mosaicActive}>モザイク</Checkbox>
      <Checkbox
        bind:on={mosaicEditing}
        onChange={(on) => {
          if (on) {
            mosaicController.editing = true
          } else {
            mosaicController.editing = false
          }
        }}
        disabled={!mosaicActive}
      >
        移動モード
      </Checkbox>
      モザイクの強度<Slider
        bind:value={mosaicScale}
        onChange={(v) => {
          mosaicFilter.setReduceRate(v)
        }}
        disabled={!mosaicActive}
        min={2}
        max={50}
        step={2}
      />
      モザイクの半径<Slider
        bind:value={mosaicRadius}
        onChange={(v) => {
          mosaicFilter.radius = v
        }}
        disabled={!mosaicActive}
        min={0}
        max={1}
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
        max={5}
        step={0.1}
      />
    </div>
  </div>
</EditorLayout>
