#version 300 es

layout (location = 0) in vec3 aVertexPosition;
layout (location = 1) in vec2 aVertexTextureCoords;

out vec2 vTextureCoords;

void main() {
  vTextureCoords = aVertexTextureCoords;
  gl_Position = vec4(aVertexPosition, 1.0);
}