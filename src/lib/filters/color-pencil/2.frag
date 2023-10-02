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

vec3 overlay(vec3 b, vec3 f) {
  float bmpness = max(b.r, max(b.g, b.b));
  
  return mix(
    2.0 * b * f,
    1.0 - 2.0 * (1.0 - b) * (1.0 - f),
    step(0.5, bmpness)
  );
}

vec2 clamp_range(vec2 v, vec2 minV, vec2 maxV) {
  return v * (maxV - minV) + minV;
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

vec3 toPastel(vec3 color, float strength) {
  vec3 hsv = rgb2hsv(color);
  // 彩度は0% ~ 95%の範囲にする
  hsv.y = clamp(hsv.y, 0.0, 0.95);
  // 明度は85% ~ 95%の範囲にする
  hsv.z = clamp(hsv.z, 0.85, 0.95);
  vec3 rgb = hsv2rgb(hsv);
  rgb = overlay(rgb, vec3(strength));
  return rgb;
}

vec3 spray(sampler2D tex, vec2 uv, vec2 texelSize, float spread, float mixRatio) {
  vec3 originalColor = texture(tex, uv).rgb;
  vec2 noise = clamp_range(hash22(uv), vec2(0.0), texelSize);
  vec2 offset = fract(noise * spread);
  vec3 randomColor = texture(tex, uv + offset).rgb;
  vec3 mixedColor = mix(originalColor, randomColor, mixRatio);
  return mixedColor;
}

uniform sampler2D uMainTex;
uniform sampler2D uEdgeTex; // edge

uniform float uEdgeContrast;
uniform float uAreaContrast;
uniform float uPaperColorBright;

in vec2 vTextureCoords;

out vec4 fragColor;

void main() {
  ivec2 iTextureSize = textureSize(uMainTex, 0);
  vec2 textureSize = vec2(float(iTextureSize.x), float(iTextureSize.y));
  vec2 texelSize = 1.0 / textureSize;
  
  vec2 texCoord = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  
  vec3 prevColor = texture(uMainTex, texCoord).rgb;
  vec3 edge = texture(uEdgeTex, texCoord).rgb;
  
  float radius = 2.0;
  float x = (texCoord.x * textureSize.x) + hash21(texCoord) * radius * 2.0 - radius;
  float y = (texCoord.y * textureSize.y) + hash21(vec2(texCoord.y, texCoord.x)) * radius * 2.0 - radius;
  vec3 noisedColor = texture(uMainTex, vec2(x, y) / textureSize).rgb;
  // ランダムで白を混ぜる
  noisedColor = mix(noisedColor, vec3(uPaperColorBright), hash21(texCoord));
  
  float dx = texelSize.x;
  float dy = texelSize.y;
  
  float c = hash21(texCoord);
    
  vec3 pp = texture(uMainTex, c + vec2(dx, dy)).rgb;
  vec3 mp = texture(uMainTex, c + vec2(-dx, dy)).rgb;
  vec3 pm = texture(uMainTex, c + vec2(dx, -dy)).rgb;
  vec3 mm = texture(uMainTex, c + vec2(-dx, -dy)).rgb;
  
  vec3 hatchR = prevColor + mm;
  hatchR -= pp;
  
  vec3 hatchL = prevColor + mp;
  hatchL -= pm;
  
  vec3 sketch = hatchR * hatchL;
  sketch = vec3(toMonochrome(sketch));
  
  vec3 sprayColor = spray(uMainTex, texCoord, texelSize, 100.0, 0.4);
  
  float edgeAverage = (edge.r + edge.g + edge.b) / 3.0;
  
  vec3 outColor = vec3(1.0) - sketch * edge;
  outColor = mix(outColor, sprayColor, dot(edge, vec3(1.0)));
  outColor = mix(outColor, toPastel(prevColor, uEdgeContrast), edgeAverage);
  outColor *= toPastel(noisedColor, uAreaContrast);
  
  fragColor = vec4(outColor, 1.0);
}