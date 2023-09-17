import { Program, Uniforms } from "sketchgl/program"
import { UseMRT } from "../../core/mrt"
import vert from "../../shaders/image.vert?raw"
import frag_1 from "./1.frag?raw"
import frag_2 from "./2.frag?raw"
import type { CanvasCoverPolygon } from "sketchgl/geometry"

export class PencilFilter {
  private _gl: WebGL2RenderingContext
  private _path1Uniforms: Uniforms<"uPencilGamma">
  private _mrtRenderer: UseMRT
  private _localProgram: Program
  private _screen: CanvasCoverPolygon

  private _uPencilGamma = 0.5

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, screen: CanvasCoverPolygon) {
    this._gl = gl
    this._screen = screen

    this._mrtRenderer = new UseMRT(gl, canvas, vert, frag_1, { texCount: 2, texUnitStart: 1 })

    this._localProgram = new Program(gl)
    this._localProgram.attach(vert, frag_2)

    this._path1Uniforms = new Uniforms(gl, ["uPencilGamma"])
    this._path1Uniforms.init(this._mrtRenderer.glProgramForMTR)
  }

  apply(out: WebGLFramebuffer | null) {
    const r = this._mrtRenderer
    const program = this._localProgram

    r.switchToMTR()
    this._path1Uniforms.float("uPencilGamma", this._uPencilGamma)
    this._screen.draw({ primitive: "TRIANGLES" })

    r.switchToNextTexture(program, out)
    this._mrtRenderer.useTexture(program, { idx: 0, name: "uPosterizeTex" })
    this._mrtRenderer.useTexture(program, { idx: 1, name: "uEdgeTex" })
    this._screen.draw({ primitive: "TRIANGLES" })
  }

  set gamma(value: number) {
    this._uPencilGamma = value
  }

  get gamma() {
    return this._uPencilGamma
  }

  get resize() {
    return this._mrtRenderer.resize
  }

  get glProgram() {
    return this._mrtRenderer.glProgramForMTR
  }
}
