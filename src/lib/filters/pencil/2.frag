#version 300 es

precision highp float;

const float PI = 3.1415926;

const float R_LUMINANCE = 0.298912;
const float G_LUMINANCE = 0.586611;
const float B_LUMINANCE = 0.114478;

// グレースケール化
float toMonochrome(vec3 color) {
  return dot(color, vec3(R_LUMINANCE, G_LUMINANCE, B_LUMINANCE));
}

// 符号なし整数の最大値
const uint UINT_MAX = 0xffffffffu;

// 算術積に使う大きな桁数の定数
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
// シフト数
uvec3 u = uvec3(1, 2, 3);

// 符号なし整数の2d => 2dハッシュ関数
uvec2 uhash22(uvec2 n){
  n ^= (n.yx << u.xy);
  n ^= (n.yx >> u.xy);
  n *= k.xy;
  n ^= (n.yx << u.xy);
  return n * k.xy;
}

// 浮動小数点数の2d => 2dハッシュ関数
vec2 hash22(vec2 b) {
  // ビット列を符号なし整数に変換
  uvec2 n = floatBitsToUint(b);
  // 値の正規化
  return vec2(uhash22(n)) / vec2(UINT_MAX);
}

// 浮動小数点数の2d => 1dハッシュ関数
float hash21(vec2 b) {
  // ビット列を符号なし整数に変換
  uvec2 n = floatBitsToUint(b);
  // 値の正規化
  return float(uhash22(n).x) / float(UINT_MAX);
}

uniform sampler2D uEdgeTex; // edge
uniform sampler2D uPosterizeTex; // posterized

in vec2 vTextureCoords;

out vec4 fragColor;

void main() {
  ivec2 iTextureSize = textureSize(uPosterizeTex, 0);
  vec2 textureSize = vec2(float(iTextureSize.x), float(iTextureSize.y));
  vec2 texelSize = 1.0 / textureSize;
  
  vec2 texCoord = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  
  vec3 posterized = texture(uPosterizeTex, texCoord).rgb;
  vec3 edge = texture(uEdgeTex, texCoord).rgb;
  
  float dx = texelSize.x;
  float dy = texelSize.y;
  
  float c = hash21(texCoord);
    
  vec3 pp = texture(uPosterizeTex, c + vec2(dx, dy)).rgb;
  vec3 mp = texture(uPosterizeTex, c + vec2(-dx, dy)).rgb;
  vec3 pm = texture(uPosterizeTex, c + vec2(dx, -dy)).rgb;
  vec3 mm = texture(uPosterizeTex, c + vec2(-dx, -dy)).rgb;
  
  vec3 hatchR = posterized + mm;
  hatchR -= pp;
  
  vec3 hatchL = posterized + mp;
  hatchL -= pm;
  
  vec3 sketch = hatchR * hatchL;
  sketch = vec3(toMonochrome(sketch));
  
  vec3 outColor = vec3(1.0) - sketch * edge;
  
  fragColor = vec4(outColor, 1.0);
}