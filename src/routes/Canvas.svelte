<script lang="ts">
  import type { FilterSketchConfig, FilterSketchFn } from "sketchgl"
  import { ImageTexture } from "sketchgl/texture"
  import { Program, Uniforms } from "sketchgl/program"
  import { CanvasCoverPolygon } from "sketchgl/geometry"
  import { SwapFramebufferRenderer } from "$lib/core/swap-fb"

  import { onMount } from "svelte"
  import Checkbox from "$lib/components/control/Checkbox.svelte"
  import Slider from "$lib/components/control/Slider.svelte"

  import defaultImage from "$lib/images/tree-woods_00123.jpg"
  import vert from "$lib/shaders/image.vert?raw"
  import frag from "$lib/shaders/grayscale.frag"

  let canvas: HTMLCanvasElement

  type FILTER = "GRAYSCALE" | "SEPIA" | "CONTRAST"

  const FILTER_MODE = {
    NONE: 0,
    GRAYSCALE: 1,
    SEPIA: 2,
    CONTRAST: 3
  }

  const FILTER_ENABLE_STATE = {
    GRAYSCALE: false,
    SEPIA: false,
    CONTRAST: false
  }

  const FILTER_UNIFORM_VALUES = {
    [FILTER_MODE.CONTRAST]: {
      uGamma: 1.0
    }
  }

  let ACTIVE_FILTERS: number[] = []

  const onChange = (target: FILTER) => (on: boolean) => {
    if (on) {
      ACTIVE_FILTERS.push(FILTER_MODE[target])
    } else {
      const index = ACTIVE_FILTERS.indexOf(FILTER_MODE[target])
      if (index > -1) {
        ACTIVE_FILTERS.splice(index, 1)
      }
    }
  }

  onMount(async () => {
    // client side only
    const { SketchFilter } = await import("sketchgl")

    const sketch: FilterSketchFn = ({ gl, canvas, fitImage }) => {
      const uniforms = new Uniforms(gl, ["uFilterMode", "uContrastGamma"])

      const APPLY_UNIFORMS = {
        [FILTER_MODE.CONTRAST]: () => {
          uniforms.float("uContrastGamma", FILTER_UNIFORM_VALUES[FILTER_MODE.CONTRAST].uGamma)
        }
      }

      const texture = new ImageTexture(gl, defaultImage)

      const program = new Program(gl)
      program.attach(vert, frag)
      program.activate()

      uniforms.init(program.glProgram)

      const plane = new CanvasCoverPolygon(gl)
      plane.setLocations({ vertices: 0, uv: 1 })

      const renderer = new SwapFramebufferRenderer(gl, canvas)

      gl.clearColor(1.0, 1.0, 1.0, 1.0)
      gl.clearDepth(1.0)

      return {
        preload: [texture.load()],
        preloaded: [
          () => {
            fitImage(texture.img)
            renderer.init(texture)
          }
        ],

        drawOnFrame() {
          plane.bind()
          renderer.begin(program.glProgram, "uTexture0")

          for (const filter of ACTIVE_FILTERS) {
            renderer.switch()

            uniforms.int("uFilterMode", filter)

            const applyUniform = APPLY_UNIFORMS[filter]
            applyUniform && applyUniform()

            plane.draw({ primitive: "TRIANGLES" })

            renderer.next()
          }

          renderer.end()

          uniforms.int("uFilterMode", FILTER_MODE.NONE)
          plane.draw({ primitive: "TRIANGLES" })
        }
      }
    }

    const config: FilterSketchConfig = {
      canvas: {
        el: canvas,
        autoResize: true
      }
    }
    SketchFilter.init(config, sketch)
  })
</script>

<canvas bind:this={canvas} />

<Checkbox bind:on={FILTER_ENABLE_STATE.GRAYSCALE} onChange={onChange("GRAYSCALE")}>
  GrayScale
</Checkbox>
<Checkbox bind:on={FILTER_ENABLE_STATE.SEPIA} onChange={onChange("SEPIA")}>Sepia</Checkbox>
<div>
  <Checkbox bind:on={FILTER_ENABLE_STATE.CONTRAST} onChange={onChange("CONTRAST")}>
    Contrast
  </Checkbox>
  <Slider
    bind:value={FILTER_UNIFORM_VALUES[FILTER_MODE.CONTRAST].uGamma}
    onChange={(value) => {
      FILTER_UNIFORM_VALUES[FILTER_MODE.CONTRAST].uGamma = value
    }}
    disabled={!FILTER_ENABLE_STATE.CONTRAST}
    min={0.1}
    max={10}
    step={0.1}
  />
</div>
