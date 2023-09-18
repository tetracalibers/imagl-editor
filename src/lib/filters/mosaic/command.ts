import { UseDepthFramebuffer } from "$lib/core/depth-offscreen"
import type { SwapFramebufferRenderer } from "$lib/core/swap-fb"
import type { CanvasCoverPolygon } from "sketchgl/geometry"
import type { Program } from "sketchgl/program"

export class MosaicFilter {
  protected _gl: WebGL2RenderingContext
  protected _canvas: HTMLCanvasElement
  protected _useFramebuffer: UseDepthFramebuffer
  protected _screen: CanvasCoverPolygon

  protected _width = 0
  protected _height = 0
  protected _scale = 12

  active = false

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, screen: CanvasCoverPolygon) {
    this._gl = gl
    this._canvas = canvas
    this._screen = screen
    this._useFramebuffer = new UseDepthFramebuffer(gl, canvas, { texUnitStart: 4 })
  }

  apply(outProgram: Program, stack: SwapFramebufferRenderer) {
    const offR = this._useFramebuffer
    const screen = this._screen

    this.initSmallOffcanvas()
    screen.draw({ primitive: "TRIANGLES" })

    stack.beginPath()
    outProgram.activate()
    offR.useTexture(outProgram, { name: "uMainTex" })
    screen.draw({ primitive: "TRIANGLES" })
    stack.endPath()
  }

  protected initSmallOffcanvas() {
    const gl = this._gl
    gl.viewport(0, 0, this._width, this._height)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._useFramebuffer.framebuffer)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  protected calcOffcanvasSize(rate: number) {
    const canvas = this._canvas
    const size = Math.min(canvas.width, canvas.height)
    const step = Math.ceil(size / rate)
    const step5multipl = Math.round(step / 5) * 5 // 最も近い5の倍数
    return step5multipl
  }

  setReduceRate(rate: number) {
    this._scale = rate

    const aspect = this._canvas.width / this._canvas.height
    const size = this.calcOffcanvasSize(rate)

    this._width = size * aspect
    this._height = size

    this._useFramebuffer.resize(this._width, this._height)
  }

  get scale() {
    return this._scale
  }

  get resizes() {
    return [() => this.setReduceRate(this._scale)]
  }
}
