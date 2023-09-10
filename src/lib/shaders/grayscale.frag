#version 300 es

precision highp float;

#pragma glslify: toGrayscale = require('sketchgl/glsl/grayscale')
#pragma glslify: toSepia = require('sketchgl/glsl/sepia')
#pragma glslify: gammaToneCurve = require('sketchgl/glsl/gamma-tone-curve')
#pragma glslify: gauss = require("sketchgl/glsl/gauss")

// Gaussianフィルタによる平滑化（横方向）
vec3 xGaussSmooth(sampler2D tex, vec2 uv, vec2 texelSize, float filterSize, float sigma) {
  float weights = 0.0;
  vec3 grad = vec3(0.0);

  float h = (filterSize - 1.0) / 2.0;

  for (float i = -h; i <= h; ++i) {
    float weight = gauss(i, sigma);
    vec2 offset = vec2(i * texelSize.x, 0.0);
    vec3 color = texture(tex, uv + offset).rgb;
    weights += weight;
    grad += color * weight;
  }

  return grad / weights;
}

// Gaussianフィルタによる平滑化（縦方向）
vec3 yGaussSmooth(sampler2D tex, vec2 uv, vec2 texelSize, float filterSize, float sigma) {
  float weights = 0.0;
  vec3 grad = vec3(0.0);

  float h = (filterSize - 1.0) / 2.0;

  for (float i = -h; i <= h; ++i) {
    float weight = gauss(i, sigma);
    vec2 offset = vec2(0.0, i * texelSize.y);
    vec3 color = texture(tex, uv + offset).rgb;
    weights += weight;
    grad += color * weight;
  }

  return grad / weights;
}

uniform sampler2D uTexture0;
uniform int uFilterMode;
// uFilterMode == 3: ガンマ補正によるコントラスト調整
uniform float uContrastGamma;
// uFilterMode == 4: x軸方向のぼかし
// uFilterMode == 5: y軸方向のぼかし
uniform float uBlurSigma;

in vec2 vTextureCoords;

out vec4 fragColor;

void main() {
  ivec2 textureSize = textureSize(uTexture0, 0);
  vec2 texelSize = 1.0 / vec2(float(textureSize.x), float(textureSize.y));
  
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  vec4 smpColor = texture(uTexture0, uv);

  vec3 finalColor = uFilterMode == 1
    ? toGrayscale(smpColor.rgb)
    : uFilterMode == 2
      ? toSepia(smpColor.rgb)
      : uFilterMode == 3
        ? gammaToneCurve(smpColor.rgb, uContrastGamma)
        : uFilterMode == 4
          ? xGaussSmooth(uTexture0, uv, texelSize, 9.0, uBlurSigma)
          : uFilterMode == 5
            ? yGaussSmooth(uTexture0, uv, texelSize, 9.0, uBlurSigma)
            : smpColor.rgb;

  fragColor = vec4(finalColor, 1.0);
}