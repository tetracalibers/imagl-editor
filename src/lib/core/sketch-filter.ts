import { type CanvasOptions, Context } from "./context"
import { Clock } from "./clock"
import { ImageTexture } from "sketchgl/texture"

export interface SketchConfig {
  canvas: CanvasOptions & {
    el: string | HTMLCanvasElement
  }
  gl?: WebGLContextAttributes
}

export interface SketchCanvas {
  canvas: HTMLCanvasElement
  gl: WebGL2RenderingContext
  fitImage: (img: HTMLImageElement) => void
}

export interface Sketch {
  drawOnFrame?: () => void
  drawOnInit?: () => void
  preloaded?: (texture: ImageTexture) => void
  resize?: (() => void)[]
}

export type SketchFn = (skCanvas: SketchCanvas) => Sketch

export class SketchFilter {
  private loopClock?: Clock
  private _context: Context
  private _redraw?: () => void
  private _preloaded?: (texture: ImageTexture) => void
  private _firstDraw?: () => void

  constructor(skCanvas: SketchConfig, sketchFn: SketchFn) {
    const { canvas: _canvas, gl: glOptions } = skCanvas
    const { el, ...canvasOptions } = _canvas

    const context = new Context(el, {
      canvas: canvasOptions,
      gl: glOptions
    })

    this._context = context

    const { canvas, gl, setFitImage: fitImage } = context
    const sketch = sketchFn({ canvas, gl, fitImage })

    this.setup(context, sketch, canvasOptions)
  }

  protected setup(context: Context, sketch: Sketch, canvasOptions: CanvasOptions) {
    const { autoResize } = canvasOptions

    const { drawOnFrame, drawOnInit, resize, preloaded } = sketch
    this._redraw = drawOnFrame

    const drawOnResize = () => {
      if (drawOnFrame) {
        const { width, height } = context.canvas
        context.gl.viewport(0, 0, width, height)
      } else {
        drawOnInit && drawOnInit()
      }
    }

    if (autoResize && drawOnResize) {
      resize && context.addAfterResize(...resize)
      context.addAfterResize(() => drawOnResize())
    }

    this._preloaded = preloaded

    this._firstDraw = () => {
      drawOnInit && drawOnInit()

      if (drawOnFrame) {
        this.loopClock = new Clock()
        this.loopClock.on("tick", drawOnFrame)
      }
    }
  }

  start = async (img: string) => {
    const gl = this._context.gl
    const texture = new ImageTexture(gl, img)
    // 画像サイズに関わらず、texelSizeを一定にしたい
    texture.MIN_FILTER = "LINEAR_MIPMAP_NEAREST"
    await texture.load()
    this._context.setFitImage(texture.img)
    this._preloaded && this._preloaded(texture)
    this._firstDraw && this._firstDraw()
  }

  changeImage = async (img: File, cb?: (src: string) => void) => {
    const gl = this._context.gl
    const src = URL.createObjectURL(img)
    const texture = new ImageTexture(gl, src)
    // 画像サイズに関わらず、texelSizeを一定にしたい
    texture.MIN_FILTER = "LINEAR_MIPMAP_NEAREST"
    await texture.load()
    this._context.setFitImage(texture.img)
    this._preloaded && this._preloaded(texture)
    cb && cb(src)
    URL.revokeObjectURL(src)
  }

  download = () => {
    const canvas = this._context.canvas

    const saveBlob = (() => {
      const $a = document.createElement("a")
      document.body.appendChild($a)
      $a.style.display = "none"
      return function saveData(blob: Blob, fileName: string) {
        const url = URL.createObjectURL(blob)
        $a.href = url
        $a.download = fileName
        $a.click()
        URL.revokeObjectURL(url)
      }
    })()

    this._redraw && this._redraw()

    canvas.toBlob((blob) => {
      if (!blob) return
      saveBlob(blob, new Date().toISOString() + ".png")
    })
  }
}
