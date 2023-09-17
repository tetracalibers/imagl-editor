import type { Program } from "sketchgl/program"

interface Options {
  texUnitStart?: number
}

export class UseFramebuffer {
  private _gl: WebGL2RenderingContext
  private _canvas: HTMLCanvasElement
  private _framebuffer: WebGLFramebuffer | null = null
  private _texUnitStart: number
  private _texture: WebGLTexture | null = null

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, options: Options) {
    this._gl = gl
    this._canvas = canvas
    this._texUnitStart = options.texUnitStart ?? 0
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
    gl.bindTexture(gl.TEXTURE_2D, this._texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  }

  protected init() {
    const gl = this._gl

    this._framebuffer = this.getInitialFramebuffer()

    this._texture = this.getInitialColorTexture()
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0)

    // Clean up
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  protected bindColorTexture() {
    const gl = this._gl
    // Bind the texture from the framebuffer
    gl.activeTexture(gl.TEXTURE0 + this._texUnitStart)
    gl.bindTexture(gl.TEXTURE_2D, this._texture)
  }

  private getInitialColorTexture() {
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

  useTexture(program: Program, { name }: { name: string }) {
    const { glProgram } = program
    if (!glProgram) throw new Error("glProgram is null")

    const gl = this._gl
    const location = gl.getUniformLocation(glProgram, name)

    gl.activeTexture(gl.TEXTURE0 + this._texUnitStart)
    gl.bindTexture(gl.TEXTURE_2D, this._texture)
    gl.uniform1i(location, this._texUnitStart)
  }

  switchToOffscreen(program: Program) {
    const gl = this._gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer)
    program.activate()
  }

  switchToNextTexture(program: Program, out: WebGLFramebuffer | null) {
    const gl = this._gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, out)
    program.activate()
  }

  get framebuffer() {
    return this._framebuffer
  }
}
