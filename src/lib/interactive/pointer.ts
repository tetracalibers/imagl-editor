export class Pointer {
  protected _el: HTMLCanvasElement
  protected _rect: DOMRect

  constructor(el: HTMLCanvasElement) {
    this._el = el
    this._rect = el.getBoundingClientRect()
  }

  protected innerPos = (x: number, y: number): [number, number] => {
    const rect = this._el.getBoundingClientRect()
    return [x - rect.left, y - rect.top]
  }

  protected touchPos = (e: TouchEvent): [number, number] => {
    if (e.changedTouches.length !== 1) return [0, 0]
    const finger = e.changedTouches[0]
    return [finger.clientX, finger.clientY]
  }

  protected mousePos = (e: MouseEvent): [number, number] => {
    return [e.clientX, e.clientY]
  }

  protected isTouchEvent = (e: MouseEvent | TouchEvent): e is TouchEvent => {
    return e.type.startsWith("touch")
  }
}
