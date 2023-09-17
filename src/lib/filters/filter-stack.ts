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
  private _actives: Map<C, FilterCommand<U>>
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

    this._actives = new Map()
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

  active(id: C) {
    const command = this._commands.get(id)
    if (command) {
      command.active = true
      this._actives.set(id, command)
    }
  }

  deactive(id: C) {
    const command = this._commands.get(id)
    if (command) {
      command.active = false
      this._actives.delete(id)
    }
  }

  get activeFilters() {
    return this._actives
  }
}
