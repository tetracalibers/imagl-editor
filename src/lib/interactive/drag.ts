import { Pointer } from "./pointer"

type Coordinate = [number, number]

export class Drag extends Pointer {
  private _position: Coordinate
  private _dragging = false

  private _onMove?: (position: Coordinate) => void

  constructor(el: HTMLElement) {
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
    if (this.isTouchEvent(e)) {
      this._position = this.innerPos(...this.touchPos(e))
    } else {
      this._position = this.innerPos(...this.mousePos(e))
    }
    this._onMove?.(this._position)
  }

  private _onDragEnd() {
    this._dragging = false
  }

  set onMove(f: (position: Coordinate) => void) {
    this._onMove = f
  }
}
