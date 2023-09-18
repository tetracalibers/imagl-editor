#version 300 es

precision highp float;

in vec2 vTextureCoords;
out vec4 fragColor;

uniform sampler2D uMainTex;
uniform int uFilterMode;
uniform float uAlpha;
uniform float uBlurSigma;
uniform float uContrastGamma;
uniform float uVoronoiSiteCount;
uniform float uVoronoiMixRatio;

// 符号なし整数の最大値
const uint UINT_MAX = 0xffffffffu;

// 算術積に使う大きな桁数の定数
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
// シフト数
uvec3 u = uvec3(1, 2, 3);

// 符号なし整数の2d => 2dハッシュ関数
uvec2 uhash22(uvec2 n) {
  n ^= n.yx << u.xy;
  n ^= n.yx >> u.xy;
  n *= k.xy;
  n ^= n.yx << u.xy;
  return n * k.xy;
}

// 浮動小数点数の2d => 2dハッシュ関数
vec2 hash22(vec2 b) {
  // ビット列を符号なし整数に変換
  uvec2 n = floatBitsToUint(b);
  // 値の正規化
  return vec2(uhash22(n)) / vec2(UINT_MAX);
}

// 第一近傍距離による胞体ノイズ
vec2 voronoi2(vec2 p) {
  // 最も近い格子点
  vec2 i = floor(p);
  // タイル内のどのあたりにいるか
  vec2 f = fract(p);

  // 最も近いものまでの距離
  float distMin = 1.0;
  // 最も近い格子点
  vec2 iMin;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      // (-1, -1) or (-1, 0) or (-1, 1) or
      // ( 0, -1) or ( 0, 0) or ( 0, 1) or
      // ( 1, -1) or ( 1, 0) or ( 1, 1)
      vec2 offset = vec2(float(x), float(y));
      // 隣接するタイル内のランダムな点
      vec2 neighbor = hash22(i + offset);
      // 隣接するタイル内のランダムな点までの距離
      float dist = distance(neighbor + offset, f);
      // distMinより近ければ更新
      if (distMin > dist) {
        iMin = neighbor;
        distMin = dist;
      }
    }
  }

  return iMin;
}

vec3 mixVoronoi(vec2 uv, vec3 color, float siteCount, float mixRatio) {
  vec2 scaled = uv * siteCount;
  vec2 voronoied = voronoi2(scaled);
  vec3 mixed = mix(vec3(voronoied, 1.0), color, mixRatio);
  return mixed;
}

// ガンマ補正のトーンカーブ
vec3 gammaToneCurve(vec3 color, float gamma) {
  return pow(color, vec3(gamma));
}

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
      : uFilterMode == 3
        ? gammaToneCurve(smpColor.rgb, uContrastGamma)
        : uFilterMode == 4
          ? mixVoronoi(uv, smpColor.rgb, uVoronoiSiteCount, uVoronoiMixRatio)
          : smpColor.rgb;

  fragColor = vec4(finalColor.rgb, uAlpha);
}
