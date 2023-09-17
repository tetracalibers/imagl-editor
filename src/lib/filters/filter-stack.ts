import { Uniforms } from "sketchgl/program"

export interface FilterCommand<U extends string> {
  modeIdx: number
  active: boolean
  applyUniforms(uniforms: Uniforms<U | "uFilterMode">): void
  uniforms: Record<U, number>
}

export const getObjectKeys = <T extends { [key: string]: unknown }>(obj: T): (keyof T)[] => {
  return Object.keys(obj)
}

export class FilterStack<C extends string, U extends string> {
  private _commands: Map<C, FilterCommand<U>>
  private _activesBefore: Map<C, FilterCommand<U>>
  private _activesAfter: Map<C, FilterCommand<U>>
  private _uniforms?: Set<U>

  constructor(commands: Record<C, FilterCommand<U>>) {
    this._commands = new Map()
    getObjectKeys(commands).forEach((key) => {
      this._commands.set(key, commands[key])
    })

    this._uniforms = new Set<U>()
    this._commands.forEach((command) => {
      getObjectKeys(command.uniforms).forEach((name) => {
        this._uniforms?.add(name)
      })
    })

    this._activesBefore = new Map()
    this._activesAfter = new Map()
  }

  initUniforms(
    gl: WebGL2RenderingContext,
    program: WebGLProgram | null,
    moreUniforms: string[] = []
  ) {
    if (!this._uniforms) return
    const uniforms = new Uniforms(gl, ["uFilterMode", ...this._uniforms, ...moreUniforms])
    uniforms.init(program)
    return uniforms
  }

  active(id: C, { before = false } = {}) {
    const command = this._commands.get(id)
    if (!command) return
    command.active = true
    before ? this._activesBefore.set(id, command) : this._activesAfter.set(id, command)
  }

  deactive(id: C, { before = false } = {}) {
    const command = this._commands.get(id)
    if (!command) return
    command.active = false
    before ? this._activesBefore.delete(id) : this._activesAfter.delete(id)
  }

  get activeBeforeFilters() {
    return this._activesBefore
  }

  get activeAfterFilters() {
    return this._activesAfter
  }
}
