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

vec3 overlay(vec3 base, vec3 blend) {
  float brightness = max(base.r, max(base.g, base.b));
  return mix(
    2.0 * base * blend,
    1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
    step(0.5, brightness)
  );
}

vec3 add(vec3 base, vec3 blend) {
  return min(base + blend, vec3(1.0));
}
vec4 roberts(sampler2D tex, vec2 uv, vec2 texelSize) {
  vec2 offset[4];
  offset[0] = vec2(texelSize.x, 0.0);
  offset[1] = vec2(0.0, texelSize.y);
  offset[2] = vec2(0.0);
  offset[3] = vec2(texelSize.x, texelSize.y);
  
  vec4 color[4];
  color[0] = texture(tex, uv + offset[0]);
  color[1] = texture(tex, uv + offset[1]);
  color[2] = texture(tex, uv + offset[2]);
  color[3] = texture(tex, uv + offset[3]);
  
  vec4 dx = color[0] - color[1];
  vec4 dy = color[2] - color[3];
  
  return abs(dx) + abs(dy);
}

void main() {
  ivec2 iTextureSize = textureSize(uMainTex, 0);
  vec2 textureSize = vec2(float(iTextureSize.x), float(iTextureSize.y));
  vec2 texelSize = 1.0 / textureSize;
  
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  
  vec3 originalColor = texture(uMainTex, uv).rgb;
  vec3 vrRandomColor = texture(uVrRandomTex, uv).rgb;
  vec3 vrOriginalColor = texture(uVrOriginalTex, uv).rgb;

  originalColor = smooth3x3(uMainTex, texelSize, uv);
  
  vec3 edge = roberts(uVrRandomTex, uv, texelSize).rgb;
  edge.r = (edge.r + edge.g + edge.b) / 3.0;
  
  vec3 borderColor = originalColor * 0.3;
  borderColor = mix(vec3(0.0), borderColor, dot(originalColor, vec3(1.0)));
  
  vec3 areaColor = mix(
    vrOriginalColor, originalColor,
    dot(originalColor, vec3(1.0)) * uVoronoiMixRatio
  );
  
  float threshold = uShowVoronoiStroke ? 0.01 : 1.0;
  vec3 glassColor = mix(borderColor, areaColor, 1.0 - step(threshold, edge.r));
  
  // uVrOriginalTexをぼかす
  vec3 blurred = smooth3x3(uVrOriginalTex, texelSize, uv);
  
  vec3 mixedColor = mix(vec3(0.0), vrRandomColor, uRandomMixRatio);
  
  // ランダムカラーを合成
  glassColor = overlay(glassColor, mixedColor);
  // グロー効果
  glassColor = add(glassColor, blurred * uGlowScale);
  
  fragColor = vec4(glassColor, 1.0);
}
