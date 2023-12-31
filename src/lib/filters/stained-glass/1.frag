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

void main() {
  ivec2 iTextureSize = textureSize(uMainTex, 0);
  vec2 textureSize = vec2(float(iTextureSize.x), float(iTextureSize.y));
  float aspect = textureSize.x / textureSize.y;
  vec2 texelSize = 1.0 / textureSize;
  
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  vec4 smpColor = texture(uMainTex, uv);
  
  vec2 tileUv = uv;
  tileUv.x *= aspect;
  tileUv *= uVoronoiSiteCount;
  vec2 voronoi = voronoi2(tileUv);
  
  // ボロノイ領域の色をランダムに求めたもの
  vec3 voronoiRandomColor = vec3(voronoi, 1.0);
  // 母点位置の色をボロノイ領域の色としたもの
  vec3 vonoroiOriginalColor = texture(uMainTex, voronoi).rgb;
  
  vrOriginalColor = vec4(vonoroiOriginalColor, 1.0);
  vrRandomColor = vec4(voronoiRandomColor, 1.0);
}
