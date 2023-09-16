#version 300 es

precision highp float;

in vec2 vTextureCoords;
out vec4 fragColor;

uniform sampler2D uOriginalTex;

void main() {
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  vec4 smpColor = texture(uOriginalTex, uv);

  fragColor = smpColor;
}