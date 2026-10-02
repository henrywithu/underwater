precision highp float;

attribute vec3 position;
attribute vec3 normal;

#include<instancesDeclaration>

uniform mat4 viewProjection;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec3 vLocalPos;

void main() {
#include<instancesVertex>
  vec4 wp = finalWorld * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(mat3(finalWorld) * normal);
  vLocalPos = position;
  gl_Position = viewProjection * wp;
}
