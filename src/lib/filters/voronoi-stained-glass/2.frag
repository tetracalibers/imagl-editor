#version 300 es

precision highp float;

in vec2 vTextureCoords;
out vec4 fragColor;

uniform sampler2D uMainTex;
uniform sampler2D uVrRandomTex;
uniform sampler2D uVrOriginalTex;

uniform float uVoronoiMixRatio;
uniform float uRandomMixRatio;
uniform float uGlowScale;
uniform bool uShowVoronoiStroke;

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

// @see https://iquilezles.org/articles/palettes/
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

// form from http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// fork from https://www.shadertoy.com/view/MsS3Wc
vec3 hsv2rgb(vec3 color) {
  // Hueを[0, 1]から[0, 6]へスケール
  float hue = color.x * 6.0;
  
  vec3 m = mod(hue + vec3(0.0, 4.0, 2.0), 6.0);
  vec3 a = abs(m - 3.0);
  vec3 rgb = clamp(a - 1.0, 0.0, 1.0);
    
  // 白とrgbを彩度（動径）に沿って補間したものに明度をかける
  return color.z * mix(vec3(1.0), rgb, color.y);
}

float posterizeHue(float hue, int level) {
  float hueStep = 255.0 / float(level - 1);
  
  float newHue = hue * 360.0;
  
  newHue = floor(newHue / hueStep + 0.5) * hueStep;
  newHue /= 360.0;
  
  return newHue;
}

float posterizeColorRatio(float ratio, int level) {
  float ratioStep = 255.0 / float(level - 1);
  
  float unclamp = ratio * 255.0;
  float newRatio = floor(unclamp / ratioStep + 0.5) * ratioStep;
  newRatio /= 255.0;
  
  return newRatio;
}

const vec3 luminanceWeight = vec3(0.298912, 0.586611, 0.114478);

void main() {
  ivec2 iTextureSize = textureSize(uMainTex, 0);
  vec2 textureSize = vec2(float(iTextureSize.x), float(iTextureSize.y));
  vec2 texelSize = 1.0 / textureSize;
  
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  
  vec3 originalColor = texture(uMainTex, uv).rgb;
  vec3 vrRandomColor = texture(uVrRandomTex, uv).rgb;
  vec3 vrOriginalColor = texture(uVrOriginalTex, uv).rgb;
  
  vec3 edge = fwidth(vrRandomColor);
  edge.r = (edge.r + edge.g + edge.b) / 3.0;

  vec3 borderColor = vec3(0.5);
  
  float threshold = uShowVoronoiStroke ? 0.01 : 1.0;
  vec3 glassColor = edge.r > threshold
    ? borderColor
    : mix(vrOriginalColor, originalColor, uVoronoiMixRatio);
  
  // uVrOriginalTexをぼかす
  vec3 blurred = smooth3x3(uVrOriginalTex, texelSize, uv);
  
  vec3 mixedColor = mix(vec3(1.0), vrRandomColor, uRandomMixRatio);
  
  // ランダムカラーを合成
  glassColor *= mixedColor;
  // グロー効果
  glassColor += blurred * uGlowScale;
  
  fragColor = vec4(glassColor, 1.0);
}
