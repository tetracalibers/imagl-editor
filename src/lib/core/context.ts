export type ResizeCallback = () => void

export type CanvasOptions = {
  width?: number
  height?: number
  fit?: "screen" | "square"
  autoResize?: boolean
}

type ScaleCanvasMethod<A = any> = {
  type: "fit-screen" | "fit-square" | "fit-image"
  fn: (params: A) => void
  params?: A
}

type ContextOptions = CanvasOptions

export class Context {
  private _canvas: HTMLCanvasElement
  private _gl: WebGL2RenderingContext
  private _scaleCanvasMethod?: ScaleCanvasMethod
  private _beforeResize: ResizeCallback[] = []
  private _afterResize: ResizeCallback[] = []
  private _resizeObserber?: ResizeObserver

  constructor(
    el: string | HTMLCanvasElement,
    options?: { canvas?: ContextOptions; gl?: WebGLContextAttributes }
  ) {
    const canvas = typeof el === "string" ? <HTMLCanvasElement>document.getElementById(el) : el
    if (!canvas) throw new Error("Canvas not found")

    const gl = canvas.getContext("webgl2", options?.gl)
    if (!gl) throw new Error("WebGL2 is not available on your browser")

    this._canvas = canvas
    this._gl = gl

    options?.canvas && this.initCanvas(options.canvas)
  }

  private initCanvas({ autoResize = true, ...options }: ContextOptions) {
    const { width, height, fit } = options
    if (width) this.canvas.width = width
    if (height) this.canvas.height = height

    if (fit === "square") {
      this.fitSquare()
      if (autoResize) {
        this._scaleCanvasMethod = {
          type: "fit-square",
          fn: this.fitSquare
        }
      }
    } else if (fit === "screen") {
      this.fitScreen()
      if (autoResize) {
        this._scaleCanvasMethod = {
          type: "fit-screen",
          fn: this.fitScreen
        }
      }
    }
  }

  addAfterResize(...fn: ResizeCallback[]) {
    this._afterResize.push(...fn)
  }

  addBeforeResize(...fn: ResizeCallback[]) {
    this._beforeResize.push(...fn)
  }

  setSize(width: number, height: number) {
    this._canvas.width = width
    this._canvas.height = height
  }

  setWidth(width: number) {
    this._canvas.width = width
  }

  setHeight(height: number) {
    this._canvas.height = height
  }

  fitSquare = () => {
    const size = Math.min(window.innerWidth, window.innerHeight)
    this.setSize(size, size)
  }

  fitScreen = () => {
    this.setSize(window.innerWidth, window.innerHeight)
  }

  private _fitImage = (img: HTMLImageElement) => {
    const imgAspect = img.width / img.height
    const fullW = window.innerWidth
    const fullH = window.innerHeight
    const windowAspect = fullW / fullH
    // 正方形画像
    if (imgAspect === 1) {
      if (img.width < fullW) {
        windowAspect > 1 ? this.setSize(fullW, fullW) : this.setSize(fullH, fullH)
      } else {
        this.setSize(img.width, img.width)
      }
      return
    }
    // 長方形画像は、スクリーンからはみ出ないようにする
    if (imgAspect > windowAspect) {
      this.setSize(fullW, fullW / imgAspect)
    } else {
      this.setSize(fullH * imgAspect, fullH)
    }
  }

  startResizeObserve() {
    const resizeFn = () => {
      this._beforeResize.forEach((fn) => fn())
      if (this._scaleCanvasMethod) {
        const { fn, params } = this._scaleCanvasMethod
        fn(params)
      }
      this._afterResize.forEach((fn) => fn())
    }

    if (this._resizeObserber) {
      this._resizeObserber.unobserve(document.body)
    }

    this._resizeObserber = new ResizeObserver(resizeFn)
    this._resizeObserber.observe(document.body)
  }

  setFitImage = (img: HTMLImageElement) => {
    this._scaleCanvasMethod = {
      type: "fit-image",
      fn: this._fitImage,
      params: img
    }
    this.startResizeObserve()
  }

  get canvas() {
    return this._canvas
  }

  get gl() {
    return this._gl
  }
}
