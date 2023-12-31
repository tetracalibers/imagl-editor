#version 300 es

precision highp float;

in vec2 vTextureCoords;
out vec4 fragColor;

uniform sampler2D uMainTex;

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

vec3 applyKernel(sampler2D tex, vec2 texelSize, vec2 center, float[9] kernel) {
  vec2[9] offset = offset3x3(texelSize);
  
  vec3 result = vec3(0.0);
  
  for (int i = 0; i < 9; i++) {
    result += offsetLookup(tex, center, offset[i]) * kernel[i];
  }
  
  return result;
}

void main() {
  ivec2 iTextureSize = textureSize(uMainTex, 0);
  vec2 textureSize = vec2(float(iTextureSize.x), float(iTextureSize.y));
  vec2 texelSize = 1.0 / textureSize;
  
  vec2 uv = vec2(vTextureCoords.x, 1.0 - vTextureCoords.y);
  vec3 originalColor = texture(uMainTex, uv).rgb;
  
  // 135 degree
  float[9] embossKernel = float[](
    0.0, -1.0, -1.0,
    1.0, 0.0, -1.0,
    1.0, 1.0, 0.0
  );
  
  float coef = 0.3;
    
  vec3 embossColor = applyKernel(uMainTex, texelSize, uv, embossKernel);
  embossColor *= coef;
  embossColor += originalColor;
  
  fragColor = vec4(embossColor, 1.0);
}
