import { Uniforms, Program } from "sketchgl/program"
import type { CanvasCoverPolygon } from "sketchgl/geometry"
import type { SwapFramebufferRenderer } from "$lib/core/swap-fb"
import vert from "../../shaders/image.vert?raw"
import frag_1 from "./1.frag?raw"
import frag_2 from "./2.frag?raw"
import { UseMRT } from "$lib/core/mrt"

export class VoronoiStainedGlassFilter {
  private _gl: WebGL2RenderingContext
  private _screen: CanvasCoverPolygon

  private _mrtRenderer: UseMRT
  private _path1Uniforms: Uniforms<"uVoronoiSiteCount">

  private _path2Program: Program
  private _path2Uniforms: Uniforms<
    "uVoronoiMixRatio" | "uRandomMixRatio" | "uGlowScale" | "uShowVoronoiStroke"
  >

  private _uVoronoiSiteCount = 40
  private _uVoronoiMixRatio = 0.8
  private _uRandomMixRatio = 0.5
  private _uGlowScale = 0.3
  private _uShowVoronoiStroke = true

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, screen: CanvasCoverPolygon) {
    this._gl = gl
    this._screen = screen

    this._mrtRenderer = new UseMRT(gl, canvas, vert, frag_1, { texCount: 2, texUnitStart: 1 })
    this._path1Uniforms = new Uniforms(gl, ["uVoronoiSiteCount"])
    this._path1Uniforms.init(this._mrtRenderer.glProgramForMTR)

    this._path2Program = new Program(gl)
    this._path2Program.attach(vert, frag_2)
    this._path2Uniforms = new Uniforms(gl, [
      "uVoronoiMixRatio",
      "uRandomMixRatio",
      "uGlowScale",
      "uShowVoronoiStroke"
    ])
    this._path2Uniforms.init(this._path2Program.glProgram)
  }

  apply(outProgram: Program, stack: SwapFramebufferRenderer) {
    const mrtR = this._mrtRenderer
    const path2Program = this._path2Program

    mrtR.switchToMTR()
    stack.bind(mrtR.glProgramForMTR, "uOriginalTex")
    this._path1Uniforms.float("uVoronoiSiteCount", this._uVoronoiSiteCount)
    this._screen.draw({ primitive: "TRIANGLES" })

    stack.beginPath()
    path2Program.activate()
    mrtR.useTexture(path2Program, { idx: 0, name: "uVrRandomTex" })
    mrtR.useTexture(path2Program, { idx: 1, name: "uVrOriginalTex" })
    this._path2Uniforms.float("uVoronoiMixRatio", this._uVoronoiMixRatio)
    this._path2Uniforms.float("uRandomMixRatio", this._uRandomMixRatio)
    this._path2Uniforms.float("uGlowScale", this._uGlowScale)
    this._path2Uniforms.bool("uShowVoronoiStroke", this._uShowVoronoiStroke)
    this._screen.draw({ primitive: "TRIANGLES" })

    stack.beginPath()
    outProgram.activate()
    stack.bindPrev(outProgram.glProgram, "uMainTex")
    this._screen.draw({ primitive: "TRIANGLES" })
    stack.endPath()
  }

  get uVoronoiSiteCount() {
    return this._uVoronoiSiteCount
  }

  set uVoronoiSiteCount(value: number) {
    this._uVoronoiSiteCount = value
  }

  get uVoronoiMixRatio() {
    return this._uVoronoiMixRatio
  }

  set uVoronoiMixRatio(value: number) {
    this._uVoronoiMixRatio = value
  }

  get uRandomMixRatio() {
    return this._uRandomMixRatio
  }

  set uRandomMixRatio(value: number) {
    this._uRandomMixRatio = value
  }

  get uGlowScale() {
    return this._uGlowScale
  }

  set uGlowScale(value: number) {
    this._uGlowScale = value
  }

  get uShowVoronoiStroke() {
    return this._uShowVoronoiStroke
  }

  set uShowVoronoiStroke(value: boolean) {
    this._uShowVoronoiStroke = value
  }

  get resizes() {
    return [this._mrtRenderer.resize]
  }
}
