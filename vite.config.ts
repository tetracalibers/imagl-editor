import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"
import glslify from "vite-plugin-glslify"

export default defineConfig({
  plugins: [
    sveltekit(),
    glslify({
      include: ["**/*.glsl", "**/*.vs", "**/*.fs", "**/*.vert", "**/*.frag"]
    })
  ]
})
