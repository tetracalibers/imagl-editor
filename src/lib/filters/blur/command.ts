import type { FilterCommand } from "./../filter-stack"
import type { Uniforms } from "sketchgl/program"

type U = "uBlurSigma"

export class BlurFilter implements FilterCommand<U> {
  modeIdx: number
  uniforms = {
    uBlurSigma: 0.25
  }
  active = false

  constructor({ modeIdx }: { modeIdx: number }) {
    this.modeIdx = modeIdx
  }

  applyUniforms(uniforms: Uniforms<U | "uFilterMode">) {
    uniforms.int("uFilterMode", this.modeIdx)
    uniforms.float("uBlurSigma", this.uniforms.uBlurSigma)
  }

  get uBlurSigma() {
    return this.uniforms.uBlurSigma
  }

  set uBlurSigma(value: number) {
    this.uniforms.uBlurSigma = value
  }
}
