import { Pointer } from "./pointer"

type Coordinate = [number, number]

export class Drag extends Pointer {
  private _position: Coordinate
  private _dragging = false

  private _onMove?: (position: Coordinate) => void

  constructor(el: HTMLCanvasElement) {
    super(el)

    const { width, height, top, left } = this._rect
    const x = left + width * 0.5
    const y = top + height * 0.5
    this._position = [x, y]

    el.addEventListener("mousedown", this._onDragStart.bind(this), { passive: false })
    el.addEventListener("touchstart", this._onDragStart.bind(this), { passive: false })

    el.addEventListener("mousemove", this._onDragMove.bind(this), { passive: false })
    el.addEventListener("touchmove", this._onDragMove.bind(this), { passive: false })

    el.addEventListener("mouseup", this._onDragEnd.bind(this), { passive: false })
    el.addEventListener("touchend", this._onDragEnd.bind(this), { passive: false })
    el.addEventListener("touchcancel", this._onDragEnd.bind(this), { passive: false })
  }

  private _onDragStart() {
    this._dragging = true
  }

  private _onDragMove(e: MouseEvent | TouchEvent) {
    if (!this._dragging) return
    const canvas = this._el
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const pos = this.isTouchEvent(e) ? this.touchPos(e) : this.mousePos(e)
    const [x, y] = this.innerPos(...pos)
    this._position = [x * scaleX, y * scaleY]
    this._onMove?.(this._position)
  }

  private _onDragEnd() {
    this._dragging = false
  }

  set onMove(f: (position: Coordinate) => void) {
    this._onMove = f
  }
}
