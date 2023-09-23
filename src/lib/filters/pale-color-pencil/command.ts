import { Program, Uniforms } from "sketchgl/program"
import { UseMRT } from "../../core/mrt"
import vert from "../../shaders/image.vert?raw"
import frag_1 from "./1.frag?raw"
import frag_2 from "./2.frag?raw"
import type { CanvasCoverPolygon } from "sketchgl/geometry"
import { UseFramebuffer } from "$lib/core/offscreen"
import type { SwapFramebufferRenderer } from "$lib/core/swap-fb"

export class PaleColorPencilFilter {
  private _gl: WebGL2RenderingContext
  private _path1Uniforms: Uniforms<"uEdgeContrast" | "uAreaContrast">
  private _mrtRenderer: UseMRT
  private _offRenderer: UseFramebuffer
  private _path2Program: Program
  private _screen: CanvasCoverPolygon

  private _uEdgeContrast = 0.8
  private _uAreaContrast = 0.8

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, screen: CanvasCoverPolygon) {
    this._gl = gl
    this._screen = screen

    this._mrtRenderer = new UseMRT(gl, canvas, vert, frag_1, { texCount: 2, texUnitStart: 1 })
    this._offRenderer = new UseFramebuffer(gl, canvas, { texUnitStart: 3 })

    this._path2Program = new Program(gl)
    this._path2Program.attach(vert, frag_2)

    this._path1Uniforms = new Uniforms(gl, ["uEdgeContrast", "uAreaContrast"])
    this._path1Uniforms.init(this._path2Program.glProgram)
  }

  apply(outProgram: Program, stack: SwapFramebufferRenderer) {
    const mrtR = this._mrtRenderer
    const offR = this._offRenderer
    const path2Program = this._path2Program

    mrtR.switchToMTR()
    stack.bind(mrtR.glProgramForMTR, "uOriginalTex")
    this._screen.draw({ primitive: "TRIANGLES" })

    mrtR.switchToNextTexture(path2Program, offR.framebuffer)
    stack.bind(path2Program.glProgram, "uMainTex")
    mrtR.useTexture(path2Program, { idx: 0, name: "uPosterizeTex" })
    mrtR.useTexture(path2Program, { idx: 1, name: "uEdgeTex" })
    this._path1Uniforms.float("uEdgeContrast", this._uEdgeContrast)
    this._path1Uniforms.float("uAreaContrast", this._uAreaContrast)
    this._screen.draw({ primitive: "TRIANGLES" })

    stack.beginPath()
    outProgram.activate()
    offR.useTexture(outProgram, { name: "uMainTex" })
    this._screen.draw({ primitive: "TRIANGLES" })
    stack.endPath()
  }

  set edgeContrast(value: number) {
    this._uEdgeContrast = value
  }

  get edgeContrast() {
    return this._uEdgeContrast
  }

  set areaContrast(value: number) {
    this._uAreaContrast = value
  }

  get areaContrast() {
    return this._uAreaContrast
  }

  get resizes() {
    return [this._offRenderer.resize, this._mrtRenderer.resize]
  }
}
