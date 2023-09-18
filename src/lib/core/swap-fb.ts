import type { ImageTexture } from "sketchgl/texture"

export class SwapFramebufferRenderer {
  private _gl: WebGL2RenderingContext
  private _canvas: HTMLCanvasElement
  private _originalTexture: WebGLTexture | null = null
  private _textures: [WebGLTexture | null, WebGLTexture | null] = [null, null]
  private _framebuffers: [WebGLFramebuffer | null, WebGLFramebuffer | null] = [null, null]
  private _renderbuffers: [WebGLRenderbuffer | null, WebGLRenderbuffer | null] = [null, null]

  private _prevIdx = 0
  private _img: HTMLImageElement | null = null

  private _count

  constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    this._gl = gl
    this._canvas = canvas
    this._count = 0
  }

  init(source: ImageTexture) {
    this._originalTexture = source.glTexture
    this._img = source.img

    const forIn = this.getInitials()
    const forOut = this.getInitials()

    this._textures = [forIn.texture, forOut.texture]
    this._framebuffers = [forIn.framebuffer, forOut.framebuffer]
    this._renderbuffers = [forIn.renderbuffer, forOut.renderbuffer]
  }

  private getInitials() {
    const gl = this._gl
    const framebuffer = this.getInitialFramebuffer()

    const texture = this.getInitialColorTexture()
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    const renderbuffer = this.getInitialRenderBuffer()
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer)

    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return {
      texture,
      framebuffer,
      renderbuffer
    }
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

  protected getInitialRenderBuffer() {
    const gl = this._gl
    if (!this._img) throw new Error("img is null")
    const { width, height } = this._img

    const renderBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)

    return renderBuffer
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

  bindPrev(program: WebGLProgram | null, name: string) {
    if (!program) throw new Error("program is null")
    const gl = this._gl
    gl.useProgram(program)
    const location = gl.getUniformLocation(program, name)

    gl.activeTexture(gl.TEXTURE0 + this._prevIdx + 1)
    gl.bindTexture(gl.TEXTURE_2D, this._textures[this._prevIdx])
    gl.uniform1i(location, this._prevIdx + 1)
  }

  beginPath() {
    const gl = this._gl
    this._count++
    const idx = this._count % 2
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffers[idx])
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    return {
      inBuf: this._framebuffers[idx],
      outBuf: this._framebuffers[(idx + 1) % 2]
    }
  }

  endPath() {
    const gl = this._gl
    const idx = this._count % 2
    this._prevIdx = idx
    gl.bindTexture(gl.TEXTURE_2D, this._textures[idx])
  }

  switchToCanvas() {
    const gl = this._gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  }

  private resizeTexture(texture: WebGLTexture | null, width: number, height: number) {
    const gl = this._gl
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.bindTexture(gl.TEXTURE_2D, null)
  }

  private resizeRenderbuffer(
    renderbuffer: WebGLRenderbuffer | null,
    width: number,
    height: number
  ) {
    const gl = this._gl
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
  }

  resize = () => {
    const { width, height } = this._canvas

    this.resizeTexture(this._textures[0], width, height)
    this.resizeRenderbuffer(this._renderbuffers[0], width, height)

    this.resizeTexture(this._textures[1], width, height)
    this.resizeRenderbuffer(this._renderbuffers[1], width, height)
  }
}
