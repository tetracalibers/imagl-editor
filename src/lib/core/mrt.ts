import { Program } from "sketchgl/program"

interface Options {
  texUnitStart?: number
  texCount: number
}

export class UseMRT {
  private _gl: WebGL2RenderingContext
  private _canvas: HTMLCanvasElement
  private _framebuffer: WebGLFramebuffer | null = null
  private _program: Program
  private _texUnitStart: number
  private _texCount: number
  private _textures: (WebGLTexture | null)[] = []

  constructor(
    gl: WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    vert: string,
    frag: string,
    options: Options
  ) {
    this._gl = gl
    this._canvas = canvas
    this._program = new Program(gl)
    this._program.attach(vert, frag)
    this._texUnitStart = options.texUnitStart ?? 0
    this._texCount = options.texCount
    this.init()
    this.bindColorTexture()
  }

  resize = () => {
    const gl = this._gl
    const { width, height } = this._canvas

    this.resizeColorTexture(width, height)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  protected resizeColorTexture(width: number, height: number): void {
    const gl = this._gl
    for (let i = 0; i < this._texCount; i++) {
      gl.bindTexture(gl.TEXTURE_2D, this._textures[i])
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }
  }

  protected init() {
    const gl = this._gl

    this._framebuffer = this.getInitialFramebuffer()

    for (let i = 0; i < this._texCount; i++) {
      this._textures[i] = this.getInitialColorTexture()
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0 + i,
        gl.TEXTURE_2D,
        this._textures[i],
        0
      )
    }

    const bufferList = this._textures.map((_, i) => gl.COLOR_ATTACHMENT0 + i)
    gl.drawBuffers(bufferList)

    // Clean up
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  protected bindColorTexture() {
    const gl = this._gl
    // Bind the texture from the framebuffer
    for (let i = 0; i < this._texCount; i++) {
      gl.activeTexture(gl.TEXTURE0 + this._texUnitStart + i)
      gl.bindTexture(gl.TEXTURE_2D, this._textures[i])
    }
  }

  protected getInitialColorTexture() {
    const gl = this._gl
    const { width, height } = this._canvas

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

    return texture
  }

  protected getInitialFramebuffer() {
    const gl = this._gl

    const frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)

    return frameBuffer
  }

  useTexture(program: Program, { idx, name }: { idx: number; name: string }) {
    const { glProgram } = program
    if (!glProgram) throw new Error("glProgram is null")

    const gl = this._gl
    const location = gl.getUniformLocation(glProgram, name)

    gl.activeTexture(gl.TEXTURE0 + this._texUnitStart + idx)
    gl.bindTexture(gl.TEXTURE_2D, this._textures[idx])
    gl.uniform1i(location, this._texUnitStart + idx)
  }

  switchToMTR() {
    const gl = this._gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer)
    this._program.activate()
  }

  switchToNextTexture(program: Program, out: WebGLFramebuffer | null) {
    const gl = this._gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, out)
    program.activate()
  }

  get glProgramForMTR() {
    return this._program.glProgram
  }
}
