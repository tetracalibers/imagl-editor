import { UseDepthFramebuffer } from "$lib/core/depth-offscreen"
import type { SwapFramebufferRenderer } from "$lib/core/swap-fb"
import type { CanvasCoverPolygon } from "sketchgl/geometry"
import { Program, Uniforms } from "sketchgl/program"
import vert from "$lib/shaders/image.vert?raw"
import frag from "./composite.frag?raw"

export class LocallyFilterMask {
  protected _gl: WebGL2RenderingContext
  protected _canvas: HTMLCanvasElement
  protected _screen: CanvasCoverPolygon

  private _compositeProgram: Program
  private _compositeUniforms: Uniforms<"uCenter" | "uRadius">

  private _usePrevFramebuffer: UseDepthFramebuffer

  private _uCenter = [0.5, 0.5]
  private _uRadius = 0.1

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, screen: CanvasCoverPolygon) {
    this._gl = gl
    this._canvas = canvas
    this._screen = screen

    this._usePrevFramebuffer = new UseDepthFramebuffer(gl, canvas, { texUnitStart: 5 })

    this._compositeProgram = new Program(gl)
    this._compositeProgram.attach(vert, frag)

    this._compositeUniforms = new Uniforms(gl, ["uCenter", "uRadius"])
    this._compositeProgram.activate()
    this._compositeUniforms.init(this._compositeProgram.glProgram)
  }

  saveBase(outProgram: Program, stack: SwapFramebufferRenderer) {
    const before = this._usePrevFramebuffer
    const screen = this._screen

    // ここまでの描画結果を保存しておく
    before.switchToOffscreen(outProgram)
    stack.bindPrev(outProgram.glProgram, "uMainTex")
    screen.draw({ primitive: "TRIANGLES" })
  }

  applyMask(outProgram: Program, stack: SwapFramebufferRenderer) {
    const compositeProgram = this._compositeProgram
    const before = this._usePrevFramebuffer
    const screen = this._screen

    // 保存しておいた描画結果の上に、加工画像を局所的に合成
    stack.beginPath()
    compositeProgram.activate()
    before.useTexture(compositeProgram, { name: "uOriginalTex" })
    stack.bindPrev(compositeProgram.glProgram, "uEffectedTex")
    this._compositeUniforms.fvector2("uCenter", this._uCenter)
    this._compositeUniforms.float("uRadius", this._uRadius)
    screen.draw({ primitive: "TRIANGLES" })
    stack.endPath()

    // 結果を保存して、次へ引き継ぐ
    // この処理を省くと、次のフィルタも局所的に適用されてしまう
    stack.beginPath()
    outProgram.activate()
    stack.bindPrev(outProgram.glProgram, "uMainTex")
    screen.draw({ primitive: "TRIANGLES" })
    stack.endPath()
  }

  get resizes() {
    return [this._usePrevFramebuffer.resize]
  }

  set center([x, y]: [number, number]) {
    const { width, height } = this._canvas
    this._uCenter = [x / width, 1.0 - y / height]
  }

  set radius(r: number) {
    this._uRadius = r
  }

  get radius() {
    return this._uRadius
  }
}
