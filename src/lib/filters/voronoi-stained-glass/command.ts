import type { Uniforms } from "sketchgl/program"
import type { FilterCommand } from "../filter-stack"

type U = "uVoronoiSiteCount" | "uVoronoiMixRatio"

export class VoronoiStainedGlassFilter implements FilterCommand<U> {
  modeIdx: number
  uniforms = {
    uVoronoiSiteCount: 50,
    uVoronoiMixRatio: 0.8
  }
  active = false

  constructor({ modeIdx }: { modeIdx: number }) {
    this.modeIdx = modeIdx
  }

  applyUniforms(uniforms: Uniforms<U | "uFilterMode">) {
    uniforms.int("uFilterMode", this.modeIdx)
    uniforms.float("uVoronoiSiteCount", this.uniforms.uVoronoiSiteCount)
    uniforms.float("uVoronoiMixRatio", this.uniforms.uVoronoiMixRatio)
  }

  get uVoronoiSiteCount() {
    return this.uniforms.uVoronoiSiteCount
  }

  set uVoronoiSiteCount(value: number) {
    this.uniforms.uVoronoiSiteCount = value
  }

  get uVoronoiMixRatio() {
    return this.uniforms.uVoronoiMixRatio
  }

  set uVoronoiMixRatio(value: number) {
    this.uniforms.uVoronoiMixRatio = value
  }
}
