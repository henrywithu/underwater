precision highp float;

attribute vec3 position;
attribute vec3 normal;

#include<instancesDeclaration>

uniform mat4 viewProjection;
uniform float uTime;
uniform float uSwimSpeed;
uniform float uSwayAmount;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vSide;
varying float vBody;

void main() {
#include<instancesVertex>
  // per-fish phase derived from its translation, so no extra instance buffer is needed
  float phase = dot(finalWorld[3].xyz, vec3(0.73, 1.31, 0.57));

  // body runs along +z (nose at +z). The tail swings most, the head barely moves.
  vec3 p = position;
  float tail = clamp((0.5 - p.z) / 1.0, 0.0, 1.0);
  float wave = sin(uTime * uSwimSpeed + phase - p.z * 4.0);
  p.x += wave * uSwayAmount * tail * tail;

  vec4 wp = finalWorld * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vNormal = normalize(mat3(finalWorld) * normal);
  vSide = position.y;
  vBody = position.z;
  gl_Position = viewProjection * wp;
}
