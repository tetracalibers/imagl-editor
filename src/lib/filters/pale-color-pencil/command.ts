import { Program, Uniforms } from "sketchgl/program"
import vert from "../../shaders/image.vert?raw"
import frag_1 from "./1.frag?raw"
import frag_2 from "./2.frag?raw"
import type { CanvasCoverPolygon } from "sketchgl/geometry"
import { UseFramebuffer } from "$lib/core/offscreen"
import type { SwapFramebufferRenderer } from "$lib/core/swap-fb"

export class PaleColorPencilFilter {
  private _gl: WebGL2RenderingContext
  private _path2Uniforms: Uniforms<"uEdgeContrast" | "uAreaContrast" | "uPaperColorBright">
  private _path1Renderer: UseFramebuffer
  private _offRenderer: UseFramebuffer
  private _path1Program: Program
  private _path2Program: Program
  private _screen: CanvasCoverPolygon

  private _uEdgeContrast = 0.8
  private _uAreaContrast = 0.8
  private _uPaperColorBright = 0.9

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, screen: CanvasCoverPolygon) {
    this._gl = gl
    this._screen = screen

    this._path1Renderer = new UseFramebuffer(gl, canvas, { texUnitStart: 1 })
    this._path1Program = new Program(gl)
    this._path1Program.attach(vert, frag_1)

    this._offRenderer = new UseFramebuffer(gl, canvas, { texUnitStart: 3 })

    this._path2Program = new Program(gl)
    this._path2Program.attach(vert, frag_2)

    this._path2Uniforms = new Uniforms(gl, ["uEdgeContrast", "uAreaContrast", "uPaperColorBright"])
    this._path2Uniforms.init(this._path2Program.glProgram)
  }

  apply(outProgram: Program, stack: SwapFramebufferRenderer) {
    const path1 = this._path1Renderer
    const offR = this._offRenderer
    const path1Program = this._path1Program
    const path2Program = this._path2Program

    path1.switchToOffscreen(path1Program)
    stack.bind(path1Program.glProgram, "uOriginalTex")
    this._screen.draw({ primitive: "TRIANGLES" })

    path1.switchToNextTexture(path2Program, offR.framebuffer)
    stack.bind(path2Program.glProgram, "uMainTex")
    path1.useTexture(path2Program, { name: "uEdgeTex" })
    this._path2Uniforms.float("uEdgeContrast", this._uEdgeContrast)
    this._path2Uniforms.float("uAreaContrast", this._uAreaContrast)
    this._path2Uniforms.float("uPaperColorBright", this._uPaperColorBright)
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

  set paperColorBright(value: number) {
    this._uPaperColorBright = value
  }

  get paperColorBright() {
    return this._uPaperColorBright
  }

  get resizes() {
    return [this._offRenderer.resize, this._path1Renderer.resize]
  }
}
