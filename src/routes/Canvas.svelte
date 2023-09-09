<script lang="ts">
  import type { FilterSketchConfig, FilterSketchFn } from "sketchgl"
  import { ImageTexture } from "sketchgl/texture"
  import { Program } from "sketchgl/program"
  import { CanvasCoverPolygon } from "sketchgl/geometry"

  import { onMount } from "svelte"

  import defaultImage from "$lib/images/tree-woods_00123.jpg"
  import vert from "$lib/shaders/image.vert?raw"
  import frag from "$lib/shaders/grayscale.frag"

  let canvas: HTMLCanvasElement

  onMount(async () => {
    // client side only
    const { SketchFilter } = await import("sketchgl")

    const sketch: FilterSketchFn = ({ gl, fitImage }) => {
      const texture = new ImageTexture(gl, defaultImage)

      const program = new Program(gl)
      program.attach(vert, frag)
      program.activate()

      const plane = new CanvasCoverPolygon(gl)
      plane.setLocations({ vertices: 0, uv: 1 })

      gl.clearColor(1.0, 0.0, 0.0, 1.0)
      gl.clearDepth(1.0)

      return {
        preload: [texture.load()],
        preloaded: [() => fitImage(texture.img)],

        drawOnFrame() {
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

          plane.bind()
          texture.activate(program.glProgram, "uTexture0")
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
