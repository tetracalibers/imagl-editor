#version 300 es

precision highp float;

uniform sampler2D uOriginalTex;
uniform sampler2D uVoronoiTex;

uniform float uMixRatio;

in vec2 vTextureCoords;

out vec4 fragColor;

void main() {
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);

  vec3 original = texture(uOriginalTex, uv).rgb;
  vec2 center = texture(uVoronoiTex, uv).xy;
  vec3 voronoi = texture(uOriginalTex, center).rgb;

  fragColor = vec4(mix(original,voronoi, uMixRatio), 1.0);
}