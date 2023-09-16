import type { ImageTexture } from "sketchgl/texture"

export class SwapFramebufferRenderer {
  private _gl: WebGL2RenderingContext
  private _canvas: HTMLCanvasElement
  private _originalTexture: WebGLTexture | null = null
  private _textures: [WebGLTexture | null, WebGLTexture | null] = [null, null]
  private _framebuffers: [WebGLFramebuffer | null, WebGLFramebuffer | null] = [null, null]

  private _img: HTMLImageElement | null = null

  private _count

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    this._gl = gl
    this._canvas = canvas
    this._count = 0
  }

  init(source: ImageTexture) {
    const gl = this._gl
    this._originalTexture = source.glTexture
    this._img = source.img

    const inTexture = this.getInitialColorTexture()
    if (!inTexture) {
      throw new Error("Failed to initialize textures")
    }
    gl.bindTexture(gl.TEXTURE_2D, inTexture)
    const inFramebuffer = this.getInitialFramebuffer()
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, inTexture, 0)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    const outTexture = this.getInitialColorTexture()
    if (!outTexture) {
      throw new Error("Failed to initialize textures")
    }
    const outFramebuffer = this.getInitialFramebuffer()
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture, 0)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    this._textures = [inTexture, outTexture]
    this._framebuffers = [inFramebuffer, outFramebuffer]
  }

  private getInitialColorTexture() {
    const gl = this._gl
    if (!this._img) throw new Error("img is null")
    const { width, height } = this._img

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

    return texture
  }

  private getInitialFramebuffer() {
    const gl = this._gl

    const frameBuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)

    return frameBuffer
  }

  bind(program: WebGLProgram | null, name: string) {
    if (!program) throw new Error("program is null")
    const gl = this._gl
    gl.useProgram(program)
    const location = gl.getUniformLocation(program, name)

    gl.activeTexture(gl.TEXTURE0 + 0)
    gl.bindTexture(gl.TEXTURE_2D, this._originalTexture)
    gl.uniform1i(location, 0)

    this._count = 0
  }

  beginPath() {
    const gl = this._gl
    if (!this._img) throw new Error("img is null")
    const { width, height } = this._img
    this._count++
    const idx = this._count % 2
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffers[idx])
    gl.viewport(0, 0, width, height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  endPath() {
    const gl = this._gl
    const idx = this._count % 2
    gl.bindTexture(gl.TEXTURE_2D, this._textures[idx])
  }

  switchToCanvas() {
    const gl = this._gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }
}
