#version 300 es

precision highp float;

in vec2 vTextureCoords;
layout (location = 0) out vec4 vrRandomColor;
layout (location = 1) out vec4 vrOriginalColor;

uniform sampler2D uMainTex;
uniform float uVoronoiSiteCount;

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

vec2[9] offset3x3(vec2 texelSize) {
  vec2 offset[9];
  
  offset[0] = vec2(-texelSize.x, -texelSize.y);
  offset[1] = vec2( 0.0, -texelSize.y);
  offset[2] = vec2( texelSize.x, -texelSize.y);
  offset[3] = vec2(-texelSize.x, 0.0);
  offset[4] = vec2( 0.0, 0.0);
  offset[5] = vec2( texelSize.x, 0.0);
  offset[6] = vec2(-texelSize.x, texelSize.y);
  offset[7] = vec2( 0.0, texelSize.y);
  offset[8] = vec2( texelSize.x, 1.0);
  
  return offset;
}

vec3 offsetLookup(sampler2D tex, vec2 center, vec2 offset) {
  return texture(tex, center + offset).rgb;
}

vec3 smooth3x3(sampler2D tex, vec2 texelSize, vec2 center) {
  vec2[9] offset = offset3x3(texelSize);
  
  vec3 result = vec3(0.0);
  
  for (int i = 0; i < 9; i++) {
    result += offsetLookup(tex, center, offset[i]) / 9.0;
  }
  
  return result;
}

void main() {
  ivec2 textureSize = textureSize(uMainTex, 0);
  vec2 texelSize = 1.0 / vec2(float(textureSize.x), float(textureSize.y));
  
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  vec4 smpColor = texture(uMainTex, uv);
  
  vec2 tileUv = uv * uVoronoiSiteCount;
  vec2 voronoi = voronoi2(tileUv);
  
  // ボロノイ領域の色をランダムに求めたもの
  vec3 voronoiRandomColor = vec3(voronoi, 1.0);
  // 母点位置の色をボロノイ領域の色としたもの
  vec3 vonoroiOriginalColor = texture(uMainTex, voronoi).rgb;
  
  vrOriginalColor = vec4(vonoroiOriginalColor, 1.0);
  vrRandomColor = vec4(voronoiRandomColor, 1.0);
}
