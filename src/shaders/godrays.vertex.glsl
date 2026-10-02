precision highp float;

attribute vec3 position;
attribute vec2 uv;

#include<instancesDeclaration>

uniform mat4 viewProjection;

varying vec2 vUv;
varying vec3 vWorldPos;
varying float vSeed;

void main() {
#include<instancesVertex>
  vec4 wp = finalWorld * vec4(position, 1.0);
  vUv = uv;
  vWorldPos = wp.xyz;
  vSeed = fract(dot(finalWorld[3].xyz, vec3(0.137, 0.531, 0.913)));
  gl_Position = viewProjection * wp;
}
