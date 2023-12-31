<script lang="ts">
  import { SketchFilter, type SketchFn } from "$lib/core/sketch-filter"
  import { CanvasCoverPolygon } from "sketchgl/geometry"
  import { Program } from "sketchgl/program"
  import vert from "$lib/shaders/image.vert?raw"
  import frag_options from "./simple.frag?raw"
  import { onMount } from "svelte"
  import defaultImage from "$lib/images/autumn-leaves_00037.jpg"
  import Slider from "$lib/components/control/Slider.svelte"
  import { SwapFramebufferRenderer } from "$lib/core/swap-fb"
  import EditorLayout from "$lib/components/layout/editor-layout.svelte"
  import Switch from "$lib/components/control/Switch.svelte"
  import ControlItem from "$lib/components/control/control-item.svelte"

  let canvas: HTMLCanvasElement
  let download: () => void
  let upload: (img: File, cb?: (src: string) => void) => void

  let SketchCanvas: SketchFilter

  let editing = {
    main: false
  }
  let sliderValue = 0.5

  const sketch: SketchFn = ({ gl, canvas }) => {
    const program = new Program(gl)
    program.attach(vert, frag_options)
    program.activate()

    const plane = new CanvasCoverPolygon(gl)
    plane.setLocations({ vertices: 0, uv: 1 })

    const stackRenderer = new SwapFramebufferRenderer(gl, canvas)

    gl.clearColor(0.0, 1.0, 1.0, 1.0)
    gl.clearDepth(1.0)

    return {
      preloaded(texture) {
        stackRenderer.init(texture)
      },
      drawOnInit() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        plane.bind()
        stackRenderer.bind(program.glProgram, "uMainTex")
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
      <Slider bind:value={sliderValue} min={0} max={1} step={0.01} />
    </ControlItem>
  </svelte:fragment>
</EditorLayout>
