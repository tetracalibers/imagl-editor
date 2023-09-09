#version 300 es

precision highp float;

#pragma glslify: toGrayscale = require('sketchgl/glsl/grayscale')
#pragma glslify: toSepia = require('sketchgl/glsl/sepia')

uniform sampler2D uTexture0;
uniform int uFilterMode;

in vec2 vTextureCoords;

out vec4 fragColor;

void main() {
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  vec4 smpColor = texture(uTexture0, uv);

  vec3 finalColor = uFilterMode == 1
    ? toGrayscale(smpColor.rgb)
    : uFilterMode == 2
      ? toSepia(smpColor.rgb)
      : smpColor.rgb;

  fragColor = vec4(finalColor, 1.0);
}