import { Program, Uniforms } from "sketchgl/program"
import voronoiVert from "./voronoi.vert?raw"
import voronoiFrag from "./voronoi.frag?raw"
import mixVert from "$lib/shaders/image.vert?raw"
import mixFrag from "./index.frag?raw"
import { InstancedGeometry, type CanvasCoverPolygon } from "sketchgl/geometry"
import { Vector2 } from "sketchgl/math"
import type { SwapFramebufferRenderer } from "$lib/core/swap-fb"
import { UseDepthFramebuffer } from "$lib/core/depth-offscreen"

const generateConeVertex = ({
  width,
  height,
  resolution
}: {
  width: number
  height: number
  resolution: number
}) => {
  const w = width
  const h = height
  const a = new Vector2(w, h).normalize()

  const cone = [0, 0, -0.95]

  for (let i = 0; i < resolution; i++) {
    const v = (i / (resolution - 1)) * Math.PI * 2
    cone.push(Math.cos(v) * a.y * 2.0)
    cone.push(Math.sin(v) * a.x * 2.0)
    cone.push(1.0)
  }

  return cone
}

const generatePoints = (count: number) => {
  const points = []

  for (let i = 0; i < count; i++) {
    points.push(Math.random(), Math.random())
  }

  return points
}

export class VoronoiWatercolorFilter {
  private _gl: WebGL2RenderingContext
  private _offRenderer: UseDepthFramebuffer
  private _voronoiProgram: Program
  private _mixProgram: Program
  private _mixUniforms: Uniforms<"uMixRatio">

  private _screen: CanvasCoverPolygon
  private _cone: InstancedGeometry

  private _uMixRatio = 0.3

  private _sitePointsCount = 2000
  private _coneResolution = 64

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, screen: CanvasCoverPolygon) {
    this._gl = gl

    this._screen = screen
    this._cone = new InstancedGeometry(gl)

    this._offRenderer = new UseDepthFramebuffer(gl, canvas, { texUnitStart: 3 })

    this._voronoiProgram = new Program(gl)
    this._voronoiProgram.attach(voronoiVert, voronoiFrag)

    this._mixProgram = new Program(gl)
    this._mixProgram.attach(mixVert, mixFrag)

    this._mixUniforms = new Uniforms(gl, ["uMixRatio"])
    this._mixProgram.activate()
    this._mixUniforms.init(this._mixProgram.glProgram)
  }

  setup(width: number, height: number) {
    const cone = this._cone

    const coneVertex = generateConeVertex({
      width: width,
      height: height,
      resolution: this._coneResolution
    })

    const sitePoints = generatePoints(this._sitePointsCount)

    cone.registAttrib("vertice", {
      location: 0,
      components: 3,
      buffer: new Float32Array(coneVertex),
      divisor: 0
    })
    cone.registAttrib("offset", {
      location: 1,
      components: 2,
      buffer: new Float32Array(sitePoints),
      divisor: 1
    })
    cone.setup()
  }

  apply(outProgram: Program, stack: SwapFramebufferRenderer) {
    const offR = this._offRenderer
    const voronoiProgram = this._voronoiProgram
    const mixProgram = this._mixProgram
    const cone = this._cone
    const screen = this._screen

    offR.switchToOffscreen(voronoiProgram)
    cone.bind()
    cone.draw({ primitive: "TRIANGLE_FAN", instanceCount: this._sitePointsCount })

    screen.bind()

    stack.beginPath()
    mixProgram.activate()
    offR.useTexture(mixProgram, { name: "uVoronoiTex" })
    stack.bindPrev(mixProgram.glProgram, "uOriginalTex")
    this._mixUniforms.float("uMixRatio", this._uMixRatio)
    screen.draw({ primitive: "TRIANGLES" })
    stack.endPath()

    stack.beginPath()
    screen.draw({ primitive: "TRIANGLES" })
    stack.endPath()
  }

  set mixRatio(value: number) {
    this._uMixRatio = value
  }

  get mixRatio() {
    return this._uMixRatio
  }

  get resizes() {
    return [this._offRenderer.resize]
  }
}
