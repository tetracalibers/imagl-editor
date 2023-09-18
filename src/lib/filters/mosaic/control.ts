import { Drag } from "$lib/interactive/drag"
import type { LocallyMosaicFilter } from "./locally"

export class MosaicAreaController {
  private _editing = false
  private _filter: LocallyMosaicFilter

  constructor(canvas: HTMLCanvasElement, filter: LocallyMosaicFilter) {
    this._filter = filter
    const watchDrag = new Drag(canvas)
    watchDrag.onMove = (position) => {
      if (!this._editing) return
      const [x, y] = position
      this._filter.center = [x / canvas.width, 1.0 - y / canvas.height]
    }
  }

  get editing() {
    return this._editing
  }

  set editing(v: boolean) {
    this._editing = v
  }
}
