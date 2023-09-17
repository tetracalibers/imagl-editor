import type { FilterCommand } from "./../filter-stack"
import type { Uniforms } from "sketchgl/program"

type U = "uContrastGamma"

export class ContrastFilter implements FilterCommand<U> {
  modeIdx: number
  uniforms = {
    uContrastGamma: 1.0
  }
  active = false

  constructor({ modeIdx }: { modeIdx: number }) {
    this.modeIdx = modeIdx
  }

  applyUniforms(uniforms: Uniforms<U | "uFilterMode">) {
    uniforms.int("uFilterMode", this.modeIdx)
    uniforms.float("uContrastGamma", this.uniforms.uContrastGamma)
  }

  get uContrastGamma() {
    return this.uniforms.uContrastGamma
  }

  set uContrastGamma(value: number) {
    this.uniforms.uContrastGamma = value
  }
}
