import type { CanvasCoverPolygon } from "sketchgl/geometry"
import { MosaicFilter } from "./command"
import { Program, Uniforms } from "sketchgl/program"
import type { SwapFramebufferRenderer } from "$lib/core/swap-fb"
import vert from "$lib/shaders/image.vert?raw"
import frag from "./locally.frag?raw"
import { UseDepthFramebuffer } from "$lib/core/depth-offscreen"

export class LocallyMosaicFilter extends MosaicFilter {
  private _compositeProgram: Program
  private _compositeUniforms: Uniforms<"uCenter" | "uRadius">

  private _usePrevFramebuffer: UseDepthFramebuffer

  private _uCenter = [0.5, 0.5]
  private _uRadius = 0.1

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, screen: CanvasCoverPolygon) {
    super(gl, canvas, screen)

    this._usePrevFramebuffer = new UseDepthFramebuffer(gl, canvas, { texUnitStart: 5 })

    this._compositeProgram = new Program(gl)
    this._compositeProgram.attach(vert, frag)

    this._compositeUniforms = new Uniforms(gl, ["uCenter", "uRadius"])
    this._compositeProgram.activate()
    this._compositeUniforms.init(this._compositeProgram.glProgram)
  }

  applyLocally(outProgram: Program, stack: SwapFramebufferRenderer) {
    const reduced = this._useFramebuffer
    const before = this._usePrevFramebuffer
    const screen = this._screen
    const compositeProgram = this._compositeProgram

    // ここまでの描画結果を保存しておく
    before.switchToOffscreen(outProgram)
    stack.bindPrev(outProgram.glProgram, "uMainTex")
    screen.draw({ primitive: "TRIANGLES" })

    // 縮小して書き込み
    this.initSmallOffcanvas()
    before.useTexture(outProgram, { name: "uMainTex" })
    screen.draw({ primitive: "TRIANGLES" })

    // 拡大時の補間によって全体にモザイクをかける
    stack.beginPath()
    outProgram.activate()
    reduced.useTexture(outProgram, { name: "uMainTex" })
    screen.draw({ primitive: "TRIANGLES" })
    stack.endPath()

    // 保存しておいた描画結果の上に、モザイク画像を局所的に合成
    stack.beginPath()
    compositeProgram.activate()
    before.useTexture(compositeProgram, { name: "uOriginalTex" })
    stack.bindPrev(compositeProgram.glProgram, "uMosaicTex")
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
    return [...super.resizes, this._usePrevFramebuffer.resize]
  }
}
