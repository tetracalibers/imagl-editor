#version 300 es

precision highp float;

#pragma glslify: toGrayscale = require('sketchgl/glsl/grayscale');

uniform sampler2D uTexture0;

in vec2 vTextureCoords;

out vec4 fragColor;

void main() {
  vec4 smpColor = texture(uTexture0, vTextureCoords);
  
  vec3 grayColor = toGrayscale(smpColor.rgb);

  fragColor = vec4(grayColor, 1.0);
}