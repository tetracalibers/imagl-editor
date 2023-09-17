#version 300 es

precision highp float;

in vec2 vTextureCoords;
out vec4 fragColor;

uniform sampler2D uMainTex;
uniform int uFilterMode;
uniform float uAlpha;
uniform float uBlurSigma;

// 正規分布（ガウス分布）
float gauss(float x, float sigma) {
  float s = sigma * sigma;
  return 1.0 / sqrt(2.0 * s) * exp(-x * x / (2.0 * s));
}

// Gaussianフィルタによる平滑化（横方向）
vec3 xGaussSmooth(sampler2D tex, vec2 uv, vec2 texelSize, float filterSize, float sigma) {
  float weights = 0.0;
  vec3 grad = vec3(0.0);

  float h = (filterSize - 1.0) / 2.0;

  for (float i = -h; i <= h; ++i) {
    float weight = gauss(i, 5.0);
    vec2 offset = vec2(i * texelSize.x, 0.0);
    vec3 color = texture(tex, uv + offset).rgb;
    vec3 color2 = texture(tex, uv).rgb;
    float d = distance(color, color2);
    weight *= gauss(d, sigma);
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
    float weight = gauss(i, 5.0);
    vec2 offset = vec2(0.0, i * texelSize.y);
    vec3 color = texture(tex, uv + offset).rgb;
    vec3 color2 = texture(tex, uv).rgb;
    float d = distance(color, color2);
    weight *= gauss(d, sigma);
    weights += weight;
    grad += color * weight;
  }

  return grad / weights;
}

void main() {
  ivec2 textureSize = textureSize(uMainTex, 0);
  vec2 texelSize = 1.0 / vec2(float(textureSize.x), float(textureSize.y));
  
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  vec4 smpColor = texture(uMainTex, uv);
  
  vec3 finalColor = uFilterMode == 1
    ? xGaussSmooth(uMainTex, uv, texelSize, 9.0, uBlurSigma)
    : uFilterMode == 2
      ? yGaussSmooth(uMainTex, uv, texelSize, 9.0, uBlurSigma)
      : smpColor.rgb;

  fragColor = vec4(finalColor.rgb, uAlpha);
}
