#version 300 es

precision highp float;

in vec2 vTextureCoords;
out vec4 fragColor;

uniform sampler2D uOriginalTex;
uniform sampler2D uMosaicTex;

uniform vec2 uCenter;
uniform float uRadius;

// 円 f(x, y) = length(xy, center) - radius の距離関数
float circleSdf(vec2 xy, vec2 center, float radius) {
  vec2 fromCenter = xy - center;
  // dot(c, c) = ||c|| * ||c|| * cos(0) = ||c||^2 = length(c)^2
  // pow(dot(c, c), 0.5) = length(c)^2^0.5 = length(c)^(2 * 0.5) = length(c)
  return pow(dot(fromCenter, fromCenter), 0.5) - radius;
}

// colorで円を塗りつぶし、それ以外の領域は透明に
float circle(vec2 xy, vec2 center, float radius, float spread) {
  float sdf = circleSdf(xy, center, radius);
  float shape = smoothstep(radius - radius * spread, radius + radius * spread, sdf);
  
  return shape;
}

void main() {
  ivec2 iTextureSize = textureSize(uOriginalTex, 0);
  vec2 textureSize = vec2(float(iTextureSize.x), float(iTextureSize.y));
  float aspect = textureSize.x / textureSize.y;
  
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);

  vec4 original = texture(uOriginalTex, uv);
  vec4 mosaic = texture(uMosaicTex, uv);
  
  float spread = 0.5;
  float shape = circle(vec2(uv.x * aspect, uv.y), vec2(uCenter.x * aspect, uCenter.y), uRadius, spread);
  
  // shape.a = 0.0のとき、originalを表示
  fragColor = original * shape + mosaic * (1.0 - shape);
}