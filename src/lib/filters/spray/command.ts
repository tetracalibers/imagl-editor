import type { Uniforms } from "sketchgl/program"
import type { FilterCommand } from "../filter-stack"

type U = "uSpraySpread" | "uSprayMixRatio"

export class SprayFilter implements FilterCommand<U> {
  modeIdx: number
  uniforms = {
    uSpraySpread: 36,
    uSprayMixRatio: 0.5
  }
  active = false

  constructor({ modeIdx }: { modeIdx: number }) {
    this.modeIdx = modeIdx
  }

  applyUniforms(uniforms: Uniforms<U | "uFilterMode">) {
    uniforms.int("uFilterMode", this.modeIdx)
    uniforms.float("uSpraySpread", this.uniforms.uSpraySpread)
    uniforms.float("uSprayMixRatio", this.uniforms.uSprayMixRatio)
  }

  get uSpraySpread() {
    return this.uniforms.uSpraySpread
  }

  set uSpraySpread(value: number) {
    this.uniforms.uSpraySpread = value
  }

  get uSprayMixRatio() {
    return this.uniforms.uSprayMixRatio
  }

  set uSprayMixRatio(value: number) {
    this.uniforms.uSprayMixRatio = value
  }
}
